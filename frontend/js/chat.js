function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight - 50) + 'px';
}
document.addEventListener('DOMContentLoaded', (event) => {
    loadMessages();
    setInterval(loadMessagesWithoutsScrolling, 5000); // Автоматическая загрузка сообщений каждые 5 секунд
});
async function loadMessages() {
    try {
        const response = await fetch('/messages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Используем токен для аутентификации
            }
        });
        if (response.ok) {
            const messages = await response.json();
            const chat = document.getElementById('main');
            chat.innerHTML = ''; // Очищаем чат перед добавлением новых сообщений
            var lastElement = document.createElement('div');
            messages.forEach(msg => {
                var newElement = document.createElement('div');
                if (msg.content.startsWith("Файл отправлен")) {
                    // Сообщение с файлом
                    newElement.className = (msg.user_id == localStorage.getItem('user_id')) ? 'messege-file-right' : 'messege-file-left';
                    const filePath = msg.content.replace("Файл отправлен: ", "");
                    newElement.innerHTML = `
                        <div class="file-container">
                            <div class="file-icon">
                                <img src="/frontend/images/файлик.png" alt="file icon">
                            </div>
                            <div class="file-name">
                                <a href="${filePath}" download>Скачать файл</a>
                            </div>
                        </div>
                        <p>${new Date(msg.datetime).toLocaleTimeString().substring(0, 5)}</p>`;
                } else {
                    // Обычное текстовое сообщение
                    newElement.className = (msg.user_id == localStorage.getItem('user_id')) ? 'messege-text-right' : 'messege-text-left';
                    newElement.innerHTML = `<p>${msg.content.replace(/\n/g, '<br>')}</p><p>${new Date(msg.datetime).toLocaleTimeString().substring(0, 5)}</p>`;
                }
                chat.appendChild(newElement);
                lastElement = newElement;
            });
            lastElement.scrollIntoView({ behavior: 'smooth' }); // Прокрутка к последнему сообщению
        } else {
            console.error('Ошибка загрузки сообщений:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
    }
}
async function loadMessagesWithoutsScrolling() {
    try {
        const response = await fetch('/messages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` // Используем токен для аутентификации
            }
        });
        if (response.ok) {
            const messages = await response.json();
            const chat = document.getElementById('main');
            chat.innerHTML = ''; // Очищаем чат перед добавлением новых сообщений
            messages.forEach(msg => {
                var newElement = document.createElement('div');
                if (msg.content.startsWith("Файл отправлен")) {
                    // Сообщение с файлом
                    newElement.className = (msg.user_id == localStorage.getItem('user_id')) ? 'messege-file-right' : 'messege-file-left';
                    const filePath = msg.content.replace("Файл отправлен: ", "");
                    newElement.innerHTML = `
                        <div class="file-container">
                            <div class="file-icon">
                                <img src="/frontend/images/файлик.png" alt="file icon">
                            </div>
                            <div class="file-name">
                                <a href="${filePath}" download>Скачать файл</a>
                            </div>
                        </div>
                        <p>${new Date(msg.datetime).toLocaleTimeString().substring(0, 5)}</p>`;
                } else {
                    // Обычное текстовое сообщение
                    newElement.className = (msg.user_id == localStorage.getItem('user_id')) ? 'messege-text-right' : 'messege-text-left';
                    newElement.innerHTML = `<p>${msg.content.replace(/\n/g, '<br>')}</p><p>${new Date(msg.datetime).toLocaleTimeString().substring(0, 5)}</p>`;
                }
                chat.appendChild(newElement);
            });
        } else {
            console.error('Ошибка загрузки сообщений:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при загрузке сообщений:', error);
    }
}
// Функция отправки текстового сообщения
async function SendMessage() {
    var text = document.getElementById('textMessege');
    if (text.value.length != 0) {
        const currentDate = new Date();
        const userId = parseInt(localStorage.getItem('user_id'), 10);
        if (isNaN(userId)) {
            console.error('User ID is missing or invalid in localStorage');
            return;
        }
        const newMessage = {
            user_id: userId,
            content: text.value,
            datetime: currentDate.toISOString()
        };
        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newMessage)
            });
            if (response.ok) {
                text.value = ''; // Очищаем поле ввода после отправки сообщения
                autoResize(text); // Перерасчет высоты поля
                loadMessages(); // Обновляем чат
                // Прокручиваем чат к последнему сообщению
                const chat = document.getElementById('main');
                chat.scrollTop = chat.scrollHeight; // Прокрутка вниз к последнему сообщению
            } else {
                console.error('Ошибка отправки сообщения:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
        }
    }
}
// Обработка клика по значку "скрепка"
document.getElementById('clip').addEventListener('click', function () {
    document.getElementById('fileInput').click(); // Открываем диалог выбора файла
});
// Обработка выбора файла
document.getElementById('fileInput').addEventListener('change', handleFileSelect);
async function handleFileSelect(event) {
    var file = event.target.files[0];
    if (file) {
        console.log('File selected:', file.name);
        const formData = new FormData();
        formData.append('file', file); // Добавляем файл в форму для отправки
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Authorization token is missing');
            return;
        }
        console.log('Отправляем токен:', token);
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `${token}` // Используем токен для аутентификации
                },
                body: formData // Отправляем файл на сервер
            });
            if (response.ok) {
                const data = await response.json();
                const filePath = data.filePath; // Получаем путь к загруженному файлу с сервера
                console.log('File uploaded successfully:', filePath);
                const currentDate = new Date();
                // Логирование всех шагов
                console.log('Текущая дата:', currentDate);
                console.log('Создание HTML элемента для файла...');
                var newMessage = `
                    <div class="messege-file-right">
                        <div class="file-container">
                            <div class="file-icon">
                                <img src="/frontend/images/файлик.png" alt="file icon">
                            </div>
                            <div class="file-name">
                                <a href="/uploads/${file.name}" download="${file.name}">${file.name}</a>
                            </div>
                        </div>
                        <p>${currentDate.toLocaleTimeString().substring(0, 5)}</p>
                    </div>`;
                // Проверка на валидность HTML
                console.log('Созданное сообщение:', newMessage);
                var chat = document.getElementById('main');
                if (!chat) {
                    console.error('Элемент с id "main" не найден при попытке вставки сообщения');
                    return;
                }
                var newElement = document.createElement('div');
                newElement.innerHTML = newMessage;
                console.log('Добавление нового элемента в чат...');
                chat.appendChild(newElement);
                console.log('Прокрутка к последнему сообщению...');
                newElement.scrollIntoView({ behavior: 'smooth' }); // Прокручиваем чат к новому сообщению
                console.log('Сообщение с файлом добавлено успешно');
            } else {
                console.error('Ошибка загрузки файла:', response.statusText);
            }
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
        }
    } else {
        console.error('No file selected');
    }
}
document.getElementById('Nickname').addEventListener('click', function() {
    window.location.href = '/frontend/PersonalData.html';
});
document.getElementById('profileButton').addEventListener('click', function() {
    window.location.href = '/frontend/index.html';
});
