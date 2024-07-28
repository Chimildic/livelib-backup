const spinnerElement = document.getElementById('spinner-root')
const iframeElement = document.getElementById('iframe-service')

window.onbeforeunload = onLoading
iframeElement.onload = onReady
setCopyright()

function onLoading() {
    spinnerElement.style.display = 'block'
    iframeElement.style.display = 'none'
}

function onReady() {
    spinnerElement.style.display = 'none'
    iframeElement.style.display = 'block'
}

function setCopyright() {
    let year = new Date().getFullYear()
    if (year != 2024) {
        year = `2024 - ${year}`
    }
    document.getElementById('copyright').innerText = `${year} © Chimildic`
}