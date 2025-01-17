let isExportCanceled = false
document.getElementById('cancelExportButton').addEventListener('click', () => (isExportCanceled = true))
document.querySelector('form').addEventListener('submit', onFormSubmit)

function onFormSubmit(event) {
    event.preventDefault()
    isExportCanceled = false
    let formDataObject = fromFormDataToObject(new FormData(event.target))
    if (formDataObject.username.length == 0) {
        return
    }
    showProgressModal(STATUS.starting)

    getBiglist({
        args: { pagename: formDataObject.pagename, username: formDataObject.username, includeColumns: formDataObject.includeColumns },
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
    if (userObject.formData.fileExtention == 'json') {
        download(filename, 'application/json', JSON.stringify(userObject.bookArray))
    } else if (userObject.formData.fileExtention == 'csv') {
        download(filename, 'text/csv', fromBookArrayToCsv(userObject))
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
    return `livelib-${formData.username.toLowerCase()}-${formData.pagename}-${new Date().toLocaleDateString()}.${formData.fileExtention}`
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

function fromBookArrayToCsv(userObject, separator = ';') {
    let columnTitles = FIELDS_DATA.items.reduce((acc, item) => (acc[item.value] = item.text, acc), {})
    let header = userObject.formData.includeColumns.map(item => columnTitles[item]).join(separator)
    let lines = []
    for (let i = 0; i < userObject.bookArray.length; i++) {
        throwIfCancelByUser()
        let book = userObject.bookArray[i]
        let line = []
        userObject.formData.includeColumns.forEach(column => {
            if (column == 'authors') {
                line.push(book.authors.map(a => a.name).join(','))
            } else if (column == 'ratingUser') {
                line.push(book.rating.user)
            } else if (column == 'ratingOverall') {
                line.push(book.rating.overall)
            } else if (['isbn', 'year', 'language', 'series', 'publishers'].includes(column)) {
                line.push(book.details[column])
            } else if (column == 'genres') {
                line.push(book.genres.map(item => item.name).join(','))
            } else if (['loved', 'reviews', 'quotes', 'read'].includes(column)) {
                line.push(book.stats[column])
            } else {
                line.push(book[column])
            }
        })
        lines.push(line.join(separator))
    }

    return [header, lines].flat().join('\n')
}

function throwIfCancelByUser() {
    if (isExportCanceled) {
        throw 'Прервано пользователем'
    }
}
