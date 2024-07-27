function doGet() {
  return HtmlService.createTemplateFromFile('page').evaluate()
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

function getBiglist(args) {
  let response = LivelibClient.getBiglist(args)
  return {
    isLastPage: response.last_page,
    pageNumber: response.page_no,
    bookArray: BookParser.parseToBookArray(response.content, args.includeColumns)
  }
}
