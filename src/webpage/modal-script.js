const STATUS = {
    starting: [
        'Ожидаю ответ сервера',
        'Вперед, в бездну!',
        'Первый шаг, а там посмотрим...',
        'Поехали!',
        'Хьюстон, у нас контакт',
        'Глубоко вдохнули и... парсим!',
        'Глаза боятся 👀 а парсер делает',
        'Маховик запущен, назад пути нет',
        'Использую магию вне Хогвартса, никому не рассказывай 🤫',
        'Даже карта Мародеров не собирет столько информации',
        'Надеюсь, этот парсинг не приведет нас в Тайную Комнату',
        'Ну-с, – бодро сказал он, – начнем пожалуй',
        'Да будет бал, да начнутся танцы! 💃',
        'Это будет леген... постой, подожди-подожди... дарно! Процесс пошел',
        'Даже тысячемильное путешествие начинается с... запуска скрипта. Ладно, метафора так себе, но суть ясна',
        'Заяц, Волк, Заяц, Волк',
        'Работает? Не знаю, но кнопка нажата',
        'А пока покормите котейку 🐱 Ну, или себя?',
        'Вы знали что Алиса умеет озвучивать книги? На телефоне тоже',
        'Создать файл? Легче лёгкого, когда у тебя есть куча свободного времени и марсианская пыль на процессоре.',
        'Скрипнули шестерни мироздания. Механизм запущен, отсчёт начался.',
    ],
    isNotLastPage: [
        'Продолжаю собирать книжки',
        'Кажется, кто-то ограбил библиотеку?',
        'Вы точно всё это читали, или просто хвастаетесь?',
        'Вы, наверное, тот самый книжный червь, о котором все говорят?',
        'Вам срочно нужен книжный шкаф побольше, а лучше два!',
        'Я не завис (наверное)',
        'while (true) read()',
        'Интересно, вы также увлечённо читаете инструкции к бытовой технике?',
    ],
    creatingFile: [
        'Записываю данные в файл',
        'Строка за строкой, файл скоро будет твой',
    ],
    result: [
        'Я это сделал! ...Надеюсь, никто не заметил, сколько раз я переделывал',
        'Финита ля комедия! И пусть никто не пострадал... сильно.',
        'Шалость удалась!',
        'Последний камень уложен. Пирамида ждёт своего фараона.',
        'Что ж, по крайней мере, я не спалил компьютер на этот раз. Уже успех.',
        'Не забудьте забрать свои вещи: портальную пушку, чувство собственной важности... Ах да, и пирожок, конечно. Куда без него.',
        'Ну вот и всё! ...А что, вы уже аплодируете? Нет? Странно...',
        'А теперь главный вопрос: как это выключить, чтобы ничего не сломать?',
        '💯',
        'Мультифункциональное устройство успешно завершило запрограммированный цикл операций, переходя в режим пониженного энергопотребления',
    ]
}

const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modal'))

function showProgressModal(status) {
    document.getElementById('modalTitle').innerText = '⏱️ Пожалуйста, подождите'
    document.getElementById('closeModalButton').classList.add('d-none')
    document.getElementById('cancelExportButton').classList.remove('d-none')
    document.getElementById('spinner').classList.remove('d-none')
    setStatusText(status)
    modal.show()
}

function showResultModal(status) {
    document.getElementById('modalTitle').innerText = '✅ Готово'
    document.getElementById('closeModalButton').classList.remove('d-none')
    document.getElementById('cancelExportButton').classList.add('d-none')
    document.getElementById('spinner').classList.add('d-none')
    setStatusText(status)
    modal.show()
}

function showErrorModal(status) {
    document.getElementById('modalTitle').innerText = '❌ Ошибка'
    document.getElementById('closeModalButton').classList.remove('d-none')
    document.getElementById('cancelExportButton').classList.add('d-none')
    document.getElementById('spinner').classList.add('d-none')
    setStatusText(status)
    modal.show()
}

function setStatusText(status) {
    let text = Array.isArray(status) ? status[randomInt(status.length)] : status
    document.getElementById('statusText').innerText = text
}

function randomInt(max) {
    return Math.floor(Math.random() * max)
}