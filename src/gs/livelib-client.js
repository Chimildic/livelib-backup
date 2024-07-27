const BASE_URL = 'https://www.livelib.ru'

const LivelibClient = (function () {
  return { getBiglist }

  /**
   * Получить страницу со списком книг.
   * 
   * @typedef {object} BiglistArgs
   * @property {string} pagename - Название страницы: read, unread, reading, wish.
   * @property {string} username - Имя пользователя, для которого запрашивается страница.
   * @property {number} pageNumber - Порядковый номер страницы.
   * @property {number} perPageCount - Количесто книг на одной странице.
   * 
   * @typedef {object} BiglistResponse
   * @property {string} content - HTML разметка страницы
   * @property {boolean} last_page - Является ли страница последней
   * @property {number} page_no - Порядковый номер страницы.
   * 
   * @param {BiglistArgs} args
   * @returns {BiglistResponse}
   */
  function getBiglist(args) {
    let body = {
      page_no: args.pageNumber || 1,
      per_page: args.perPageCount || 100,
      is_new_design: 'll2015b',
      is_prev: 'false'
    }

    let response = new RequestBuilder()
      .withPath(`/reader/${args.username}/${args.pagename}/listview/biglist`)
      .withBody(body)
      .post()

    response.page_no = body.page_no
    return response
  }

})()

const CustomUrlFetchApp = (function () {
  let countRequest = 0;
  return {
    fetch, fetchAll, objectToUrlEncoded,
    get CountRequest() { return countRequest },
  };

  function fetch(url, params = {}) {
    params.muteHttpExceptions = true;
    return readResponse(tryFetch(url, params), url, params);
  }

  function fetchAll(requests) {
    requests.forEach((request) => (request.muteHttpExceptions = true));
    let responses = [];
    let limit = gooexKeyValue.REQUESTS_IN_ROW || 40;
    let count = Math.ceil(requests.length / limit);
    for (let i = 0; i < count; i++) {
      let requestPack = requests.splice(0, limit);
      let responsePack = sendPack(requestPack).map((response, index) =>
        readResponse(response, requestPack[index].url, {
          headers: requestPack[index].headers,
          payload: requestPack[index].payload,
          muteHttpExceptions: requestPack[index].muteHttpExceptions,
        })
      );
      Combiner.push(responses, responsePack);
    }
    return responses;

    function sendPack(requests) {
      let raw = tryFetchAll(requests);
      if (typeof raw == 'undefined') {
        return [];
      }
      let failed = raw.reduce((failed, response, index) => {
        if (response.getResponseCode() == 429) {
          failed.requests.push(requests[index])
          failed.syncIndexes.push(index);
          let seconds = parseRetryAfter(response);
          if (failed.seconds < seconds) {
            failed.seconds = seconds;
          }
        }
        return failed;
      }, { seconds: 0, requests: [], syncIndexes: [] });

      if (failed.seconds > 0) {
        Admin.pause(failed.seconds);
        sendPack(failed.requests).forEach((response, index) => {
          let requestIndex = failed.syncIndexes[index];
          raw[requestIndex] = response;
        });
      }
      return raw;
    }

    function tryFetchAll(requests) {
      return tryCallback(() => {
        countRequest += requests.length;
        return UrlFetchApp.fetchAll(requests)
      });
    }
  }

  function readResponse(response, url, params = {}) {
    if (isSuccess(response.getResponseCode())) {
      return onSuccess();
    }
    return onError();

    function isSuccess(code) {
      return code >= 200 && code < 300;
    }

    function onSuccess() {
      let type = response.getHeaders()['Content-Type'] || '';
      if (type.includes('json')) {
        return parseJsonResponse(response) || [];
      }
      return response;
    }

    function onError() {
      let responseCode = response.getResponseCode();
      if (responseCode == 429) {
        return onRetryAfter();
      }
      writeErrorLog();
      if (responseCode >= 500) {
        return tryFetchOnce();
      }
    }

    function onRetryAfter() {
      Admin.pause(parseRetryAfter(response));
      return fetch(url, params);
    }

    function tryFetchOnce() {
      Admin.pause(2);
      response = tryFetch(url, params);
      if (isSuccess(response.getResponseCode())) {
        return onSuccess();
      }
      writeErrorLog();
    }

    function writeErrorLog() {
      Admin.printError(`Номер: ${response.getResponseCode()}\nАдрес: ${url}\nТекст ответа: ${response.getContentText().substring(0, 500)}`);
    }
  }

  function parseRetryAfter(response) {
    return 1 + (parseInt(response.getHeaders()['Retry-After']) || 2);
  }

  function tryFetch(url, params) {
    return tryCallback(() => {
      countRequest++;
      return UrlFetchApp.fetch(url, params)
    });
  }

  function tryCallback(callback, attempt = 0) {
    try {
      return callback();
    } catch (error) {
      Admin.printError('При отправке запроса произошла ошибка:\n', error.stack);
      if (attempt++ < 2) {
        Admin.pause(5);
        return tryCallback(callback, attempt);
      }
    }
  }

  function objectToUrlEncoded(obj) {
    return Object.entries(obj)
      .filter(([key, value]) => value !== undefined || (typeof value == 'string' && value.length > 0))
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }

  function parseJsonString(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      Admin.printError(`Не удалось преобразовать строку JSON в объект JavaScript\n${error.stack}\n${content}`);
      return undefined;
    }
  }

  function parseJsonResponse(response) {
    let content = response.getContentText();
    if (content.length == 0) {
      return { msg: 'Пустой ответ', status: response.getResponseCode() };
    }
    return parseJsonString(content);
  }
})()

const Admin = (function () {
  return { printInfo, printError, pause, }

  function printInfo(...data) {
    console.info(...data)
  }

  function printError(...data) {
    console.error(...data)
  }

  function pause(seconds) {
    console.info(`Операция продолжится после паузы ${seconds}с.`);
    Utilities.sleep(seconds * 1000);
  }
})()

class RequestBuilder {

  constructor() {
    this.withHost = this._urlSetter('host')
    this.withPath = this._urlSetter('path')
    this.withQuery = this._urlSetter('query')

    this._withMethod = this._paramSetter('method')
    this._withHeaders = this._paramSetter('headers')
    this.withBody = this._paramSetter('payload')
    this.withContentType = this._paramSetter('contentType')

    this.get = () => this._build('get')._execute()
    this.post = () => this._build('post')._execute()

    this.withHost(BASE_URL)
  }

  _urlSetter(key) {
    return function (value) {
      this[key] = value
      return this
    }
  }

  _paramSetter(key) {
    return function (value) {
      this._params = this._params || {}
      this._params[key] = typeof value === 'object' ? { ...this._params[key], ...value } : value
      return this
    }
  }

  _build(method) {
    this._url = this.host + this.path + (this.query ? `?${CustomUrlFetchApp.objectToUrlEncoded(this.query)}` : '')
    if (this._params.hasOwnProperty('payload') && !this._params.hasOwnProperty('contentType')) {
      this
        .withContentType('application/x-www-form-urlencoded')
        .withBody(CustomUrlFetchApp.objectToUrlEncoded(this._params.payload))
    }
    return this
      ._withHeaders({ "x-requested-with": "XMLHttpRequest" })
      ._withMethod(method)
  }

  _execute() {
    return CustomUrlFetchApp.fetch(this._url, this._params)
  }

}
