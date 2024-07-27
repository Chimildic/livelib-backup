const BookParser = (function () {
  return { parseToBookArray }

  function parseToBookArray(htmlContent, includeColumns) {
    let bookArray = []
    let currentDate = undefined
    let $ = Cheerio.load(htmlContent, null, false)
    let columns = includeColumns.reduce((acc, item) => (acc[item] = true, acc), {})

    $._root.children.forEach(node => {
      if (node.attribs == undefined || node.attribs.class == undefined) {
        return
      } else if (node.attribs.class.includes('brow-h2')) {
        currentDate = $('h2', node).text()
      } else if (node.attribs.class.includes('book-item-manage')) {
        let book = parseToBook($, node, currentDate, columns)
        bookArray.push(book)
      }
    })

    return bookArray
  }

  function parseToBook($, node, currentDate, columns) {
    let book = {}

    let bookTitleNode = $('a.brow-book-name', node)[0]
    columns.title && (book.title = bookTitleNode.firstChild.nodeValue)
    columns.bookHref && (book.bookHref = BASE_URL + bookTitleNode.attribs.href)
    columns.coverHref && (book.coverHref = $('img', node)[0].attribs.src)
    columns.annotation && (book.annotation = $('[id*="full"]', node).text().split('\n').map(line => line.trim()).join('\n'))
    columns.readDate && currentDate && (book.readDate = currentDate)

    if (columns.ratingOverall || columns.ratingUser) {
      book.rating = {}
      $('span.rating-value', node).each((index, spanNode) => {
        if (columns.ratingOverall && index == 0) {
          book.rating.overall = spanNode.firstChild.nodeValue
        } else if (columns.ratingUser && index == 1) {
          book.rating.user = spanNode.firstChild.nodeValue
        }
      })
    }

    if (columns.authors) {
      book.authors = []
      $('a[class*="brow-book-author"]', node).each((index, aNode) => {
        book.authors.push({ name: aNode.firstChild.nodeValue, href: BASE_URL + aNode.attribs.href })
      })
    }

    if (columns.genres) {
      book.genres = []
      $('a.label-genre', node).each((index, aNode) => {
        let lines = aNode.firstChild.nodeValue.split(/\xa0/) // символ неразыврного пробела для строк "№10 в жанре X"
        if (lines.length == 3) {
          book.genres.push({ topPlace: lines[0], name: lines[2], href: BASE_URL + aNode.attribs.href })
        } else {
          book.genres.push({ name: lines[0], href: BASE_URL + aNode.attribs.href })
        }
      })
    }

    if (columns.statLoved || columns.statReviews || columns.statQuotes || columns.statRead) {
      book.stats = {}
      $('div.brow-stats > a', node).each((index, aNode) => {
        let value = parseInt(aNode.lastChild.nodeValue)
        if (columns.statLoved && index == 0) {
          book.stats.loved = value
        } else if (columns.statReviews && index == 1) {
          book.stats.reviews = value
        } else if (columns.statQuotes && index == 2) {
          book.stats.quotes = value
        } else if (columns.statRead && index == 3) {
          book.stats.read = value
        }
      })
    }

    if (columns.isbn || columns.year || columns.publishers || columns.series || columns.language) {
      book.details = {}
      $('tr', node).each((index, trNode) => {
        let [key, value] = $(trNode).text().split(':')
        key = key.trim().toLowerCase()
        if (columns.isbn && key.includes('isbn')) {
          book.details.isbn = value
        } else if (columns.year && key.includes('год')) {
          book.details.year = value
        } else if (columns.publishers && key.includes('издатель')) {
          book.details.publishers = value
        } else if (columns.series && key.includes('серия')) {
          book.details.series = value
        } else if (columns.language && key.includes('язык')) {
          book.details.language = value
        }
      })
    }

    return book
  }

})()