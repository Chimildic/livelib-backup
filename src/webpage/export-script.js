let isExportCanceled = false
document.getElementById('cancelExportButton').addEventListener('click', () => (isExportCanceled = true))
document.querySelector('form').addEventListener('submit', onFormSubmit)

function convertToGoodreadsDateFormat(russianDate) {
    const monthMap = {
        'январь': '01',
        'февраль': '02',
        'март': '03',
        'апрель': '04',
        'май': '05',
        'июнь': '06',
        'июль': '07',
        'август': '08',
        'сентябрь': '09',
        'октябрь': '10',
        'ноябрь': '11',
        'декабрь': '12'
    }
    
    // Parse "Декабрь 2025 г." format (nominative case with capital letter)
    const match = russianDate.match(/(\S+)\s+(\d{4})\s*г?\.?/i)
    if (!match) {
        return russianDate // Return original if format not recognized
    }
    
    const monthName = match[1].toLowerCase()
    const year = match[2]
    
    const month = monthMap[monthName]
    if (!month) {
        return russianDate // Return original if month not recognized
    }
    
    return `${year}/${month}/01`
}

function onFormSubmit(event) {
    event.preventDefault()
    isExportCanceled = false
    let formDataObject = fromFormDataToObject(new FormData(event.target))
    if (formDataObject.text.length == 0) {
        return
    }
    showProgressModal(STATUS.starting)

    getBiglist({
        args: { pagename: formDataObject.pagename, text: formDataObject.text, includeColumns: formDataObject.includeColumns },
        formData: formDataObject,
    })
}

function getBiglist(userObject) {
    try {
        google.script.run
            .withUserObject(userObject)
            .withSuccessHandler(onSuccess)
            .withFailureHandler(onFailure)
        ['getBiglist'](userObject.args)
    } catch (error) {
        showErrorModal(`Не удалось отправить запрос на сервер.\n${error.message}`)
    }
}

function onSuccess(response, userObject) {
    throwIfCancelByUser()
    if (response.isError) {
        showErrorModal(response.text)
        return
    }
    userObject.bookArray = userObject.bookArray || []
    userObject.bookArray.push(...response.bookArray)
    if (response.isLastPage) {
        delete userObject.args
        userObject.totalPages = response.pageNumber
        onFinish(userObject)
    } else {
        setStatusText(STATUS.isNotLastPage)
        userObject.args.pageNumber = response.pageNumber + 1
        getBiglist(userObject)
    }
}

function onFailure(error, userObject) {
    showErrorModal(`Процесс получения данных с Livelib прерван ошибкой.\n${error.message}`)
}

function onFinish(userObject) {
    if (userObject.bookArray.length == 0) {
        showResultModal('У пользователя нет книжек на выбранной странице')
        return
    }

    setStatusText(STATUS.creatingFile)
    let filename = createFilename(userObject.formData)
    if ('json' == userObject.formData.fileExtention) {
        download(filename, 'application/json', JSON.stringify(userObject.bookArray))
    } else if ('csv' == userObject.formData.fileExtention) {
        download(filename, 'text/csv', fromBookArrayToCsv(userObject, ';', '.', false))
    } else if ('csv_goodreads' == userObject.formData.fileExtention) {
        download(filename, 'text/csv', fromBookArrayToCsv(userObject, ',', ' ', true))
    }
    showResultModal(STATUS.result)
}

function download(filename, mimeType, content) {
    let blob = new Blob([content], { type: [mimeType, 'charset=utf-8'].join(';') })
    let url = URL.createObjectURL(blob)

    let aElement = document.createElement('a')
    aElement.href = url
    aElement.download = filename

    throwIfCancelByUser()
    aElement.click()

    aElement.remove()
    URL.revokeObjectURL(url)
}

function createFilename(formData) {
    let fileExtention = formData.fileExtention.split('_')[0]
    return `livelib-${formData.text.toLowerCase()}-${formData.pagename}-${new Date().toLocaleDateString()}.${fileExtention}`
}

function fromFormDataToObject(formData) {
    return formData.entries().reduce((acc, [key, value]) => {
        if (acc[key] == undefined) {
            acc[key] = value
        } else if (Array.isArray(acc[key])) {
            acc[key].push(value)
        } else {
            acc[key] = [acc[key]]
            acc[key].push(value)
        }
        return acc
    }, {})
}

function fromBookArrayToCsv(userObject, separator, replacement, isGoodReadsFormat = false) {
    let lines = []
    userObject.bookArray.forEach(book => {
        throwIfCancelByUser()
        getIsbnList(book).forEach(isbn => {
            let line = userObject.formData.includeColumns.map(column => getColumnValue(book, column, isbn, isGoodReadsFormat))
                .map(value => formatValue(value, separator, replacement))
                .join(separator)
            lines.push(line)
        })
    })

    let header = createHeader()
    if (isGoodReadsFormat) {
        let pageName = separator + PAGENAME_DATA.items.find(i => i.value === userObject.formData.pagename)?.grText
        lines.forEach((line, index) => lines[index] += pageName)
    }

    return [header, ...lines].join('\n')


    function getIsbnList(book) {
        let list = []
        let isbnString = book.details?.isbn || ''
        if (isGoodReadsFormat) {
            list = isbnString.split(',').filter(isbn => isbn.trim() !== '')
        }
        return list.length == 0 ? [isbnString] : list
    }

    function getColumnValue(book, column, isbn, isGoodReadsFormat) {
        switch (column) {
            case 'authors':
                return book.authors.map(a => a.name).join(',')
            case 'ratingUser':
                return book.rating.user
            case 'ratingOverall':
                return book.rating.overall
            case 'isbn':
                return isbn
            case 'genres':
                return book.genres.map(item => item.name).join(',')
            case 'readDate':
                if (isGoodReadsFormat && book.readDate) {
                    return convertToGoodreadsDateFormat(book.readDate)
                }
                return book.readDate
            case 'statLoved':
            case 'statReviews':
            case 'statQuotes':
            case 'statRead':
                return book.stats[column.split('stat')[1].toLowerCase()]
            case 'year':
            case 'language':
            case 'series':
            case 'publishers':
                return book.details[column]
            default:
                return book[column]
        }
    }

    function formatValue(value, separator, replacement) {
        return typeof value === 'string'
            ? value.replaceAll(separator, replacement).replace(/[\r\n]/g, ' ').trim()
            : value
    }

    function createHeader() {
        let columnTitles = FIELDS_DATA.items.reduce((acc, item) => {
            acc[item.value] = isGoodReadsFormat ? (item.grText || item.text) : item.text
            return acc
        }, {})
        let header = userObject.formData.includeColumns.map(item => columnTitles[item]).join(separator)
        if (isGoodReadsFormat) header += `${separator}Shelves`
        return header
    }
}

function throwIfCancelByUser() {
    if (isExportCanceled) {
        throw 'Прервано пользователем'
    }
}
