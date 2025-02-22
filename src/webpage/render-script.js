const PAGENAME_DATA = {
    legend: 'Страница',
    type: 'radio',
    name: 'pagename',
    items: [
        { value: 'read', grText: 'read', text: 'Прочитал', checked: true },
        { value: 'unread', grText: 'unread', text: 'Не дочитал' },
        { value: 'reading', grText: 'currently-reading', text: 'Читаю сейчас' },
        { value: 'wish', grText: 'to-read', text: 'Хочу прочитать' },
    ]
}

const FIELDS_DATA = {
    legend: 'Колонки',
    type: 'checkbox',
    name: 'includeColumns',
    items: [
        { value: 'title', grText: 'Title', text: 'Название', checked: true },
        { value: 'authors', grText: 'Author', text: 'Автор', checked: true },
        { value: 'readDate', grText: 'Date Read', text: 'Дата прочтения', checked: true },
        { value: 'ratingUser', grText: 'My Rating', text: 'Моя оценка', checked: true },
        { value: 'ratingOverall', grText: 'Average Rating', text: 'Общая оценка', checked: false },
        { value: 'isbn', grText: 'ISBN', text: 'ISBN', checked: true },
        { value: 'genres', text: 'Жанры', checked: false },
        { value: 'publishers', grText: 'Publisher', text: 'Издатель', checked: false },
        { value: 'year', grText: 'Year Published', text: 'Дата издания', checked: false },
        { value: 'language', text: 'Язык', checked: false },
        { value: 'series', text: 'Серия', checked: false },
        { value: 'statLoved', text: 'Количество лайков', checked: false },
        { value: 'statReviews', text: 'Количество рецензий', checked: false },
        { value: 'statQuotes', text: 'Количество цитат', checked: false },
        { value: 'statRead', text: 'Количество прочтений', checked: false },
        { value: 'bookHref', text: 'Ссылка на книгу', checked: false },
        { value: 'coverHref', text: 'Ссылка на обложку', checked: false },
        { value: 'annotation', text: 'Аннотация', checked: false },
    ]
}

const FILE_EXTENSTION_DATA = {
    legend: 'Формат файла',
    type: 'radio',
    name: 'fileExtention',
    items: [
        { value: 'csv', text: 'csv', checked: true },
        { value: 'json', text: 'json' },
        { value: 'csv_goodreads', text: 'для импорта в goodreads' }
    ]
}

renderFieldsetContent('pagename-root', PAGENAME_DATA)
renderFieldsetContent('book-columns-root', FIELDS_DATA)
renderFieldsetContent('file-extension-root', FILE_EXTENSTION_DATA)

function renderFieldsetContent(id, data) {
    let fragment = document.createDocumentFragment()

    let h5 = document.createElement('h5')
    h5.className = 'col col-sm-12'
    h5.innerText = data.legend
    fragment.appendChild(h5)

    let col
    data.items.forEach((item, index) => {
        if (index % 6 == 0) {
            col = document.createElement('div')
            col.className = 'col'
            fragment.appendChild(col)
        }

        let input = document.createElement('input')
        input.className = 'form-check-input'
        input.type = data.type
        input.name = data.name
        input.value = item.value
        input.checked = item.checked

        let label = document.createElement('label')
        label.className = 'form-check-label'
        label.appendChild(input)
        label.appendChild(document.createTextNode(item.text))

        let div = document.createElement('div')
        div.className = 'form-check'
        div.appendChild(label)

        col.appendChild(div)
    })

    let root = document.getElementById(id, data)
    root.appendChild(fragment)
}
