function doGet() {
  return HtmlService.createTemplateFromFile('page')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

function getBiglist(args) {
  let result
  let response = LivelibClient.getBiglist(args)
  if (response.error_code == 0) {
    result = {
      isLastPage: response.last_page,
      pageNumber: response.page_no,
      bookArray: BookParser.parseToBookArray(response.content, args.includeColumns)
    }
  } else {
    result = {
      isError: true,
      code: response.error_code
    }
    if (result.code == -3) {
      result.text = 'Пользователь не найден. Проверьте правильность имени.'
    } else {
      result.text = `Livelib вернул ошибку c кодом ${result.code}`
    }
  }
  return result
}
