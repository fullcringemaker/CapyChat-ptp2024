document.addEventListener('DOMContentLoaded', (event) => {  
    fetch('/user', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('firstName').value = data.name;
        document.getElementById('surname').value = data.surname;
        document.getElementById('phoneNumber').value = data.phone;
        document.getElementById('nickname').value = data.nickname;
    })
    .catch(error => {
        console.error('Ошибка при получении данных пользователя:', error);
    });
});

function editField(fieldId) {
    const field = document.getElementById(fieldId);
    const editButton = document.querySelector(`#${fieldId} ~ .edit`);
    const saveButton = document.querySelector(`#save-${fieldId}`);
    const cancelButton = document.querySelector(`#cancel-${fieldId}`);

    field.dataset.originalValue = field.value; 
    field.readOnly = false;

    if (fieldId === 'phoneNumber') {
        field.value = '+';
    } else {
        field.value = ''; 
    }

    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';
    cancelButton.style.display = 'inline-block';
}

function saveField(fieldId) {
    const field = document.getElementById(fieldId);
    const editButton = document.querySelector(`#${fieldId} ~ .edit`);
    const saveButton = document.querySelector(`#save-${fieldId}`);
    const cancelButton = document.querySelector(`#cancel-${fieldId}`);

    const invalidChars = /[^a-zA-Zа-яА-Я\s-]/; 
    const nicknameInvalidChars = /[^a-zA-Z0-9-._]/;

    // Валидация поля в зависимости от его ID
    switch (fieldId) {
        case 'firstName':
            if (field.value.trim() === '') {
                showPopup("Поле не может оставаться пустым", 'error');
                return;
            }
            if (field.value.trim().length < 1) {
                showPopup("Имя должно содержать не менее 1 символа", 'error');
                return;
            }
            if (field.value.length > 25) {
                showPopup("Имя не должно превышать 25 символов", 'error');
                return;
            }
            if (invalidChars.test(field.value)) {
                showPopup("Использование недопустимых символов", 'error');
                return;
            }
            if (/[\s-]{2,}/.test(field.value)) {
                showPopup("Не может быть более одного пробела или тире подряд", 'error');
                return;
            }
            if (/^[\s-]|[\s-]$/.test(field.value)) {
                showPopup("Имя не может начинаться или заканчиваться пробелом или тире", 'error');
                return;
            }
            break;
        case 'surname':
            if (field.value.trim() === '') {
                showPopup("Поле не может оставаться пустым", 'error');
                return;
            }
            if (field.value.trim().length < 1) {
                showPopup("Фамилия должна содержать не менее 1 символа", 'error');
                return;
            }
            if (field.value.length > 25) {
                showPopup("Фамилия не должна превышать 25 символов", 'error');
                return;
            }
            if (invalidChars.test(field.value)) {
                showPopup("Использование недопустимых символов", 'error');
                return;
            }
            if (/[\s-]{2,}/.test(field.value)) {
                showPopup("Не может быть более одного пробела или тире подряд", 'error');
                return;
            }
            if (/^[\s-]|[\s-]$/.test(field.value)) {
                showPopup("Фамилия не может начинаться или заканчиваться пробелом или тире", 'error');
                return;
            }
            break;
        case 'phoneNumber':
            if (field.value.trim() === '') {
                showPopup("Поле не может оставаться пустым", 'error');
                return;
            }
            if (!field.value.startsWith('+')) {
                showPopup("Номер телефона должен начинаться с +", 'error');
                return;
            }
            if (!/^\+\d+$/.test(field.value)) {
                showPopup("Номер телефона должен содержать только цифры после +", 'error');
                return;
            }
            if (field.value.length < 12) { // +1 for the '+' sign
                showPopup("Номер телефона должен содержать не менее 11 цифр после +", 'error');
                return;
            }
            if (field.value.length > 20) {
                showPopup("Номер телефона не должен превышать 20 символов", 'error');
                return;
            }
            break;
        case 'nickname':
            if (field.value.trim() === '') {
                showPopup("Поле не может оставаться пустым", 'error');
                return;
            }
            if (field.value.trim().length < 8) {
                showPopup("Никнейм должен содержать не менее 8 символов", 'error');
                return;
            }
            if (field.value.length > 25) {
                showPopup("Никнейм не должен превышать 25 символов", 'error');
                return;
            }
            if (/[\u0400-\u04FF]/.test(field.value)) {
                showPopup("Никнейм не должен содержать кириллицу", 'error');
                return;
            }
            if (nicknameInvalidChars.test(field.value)) {
                showPopup("Используются недопустимые символы", 'error');
                return;
            }
            if (!/[^._-]/.test(field.value)) {
                showPopup("Недопустимый формат никнейма", 'error');
                return;
            }
            break;
    }

    // Отправка данных на сервер
    fetch('/updateUser', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token') // Получение токена из Local Storage
        },
        body: JSON.stringify({
            [fieldId]: field.value
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            showPopup("Изменения сохранены!", 'success');
        } else {
            showPopup("Ошибка сохранения данных.", 'error');
        }
    })
    .catch(error => showPopup("Ошибка сервера: " + error.message, 'error'));

    // Отключение редактирования и изменение кнопок
    field.readOnly = true;

    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';
}


function cancelEdit(fieldId) {
    const field = document.getElementById(fieldId);
    const editButton = document.querySelector(`#${fieldId} ~ .edit`);
    const saveButton = document.querySelector(`#save-${fieldId}`);
    const cancelButton = document.querySelector(`#cancel-${fieldId}`);

    field.value = field.dataset.originalValue;
    field.readOnly = true;

    editButton.style.display = 'inline-block';
    saveButton.style.display = 'none';
    cancelButton.style.display = 'none';

    showPopup("Редактирование отменено!", 'error');
}

function showPopup(message, type = 'error') {
    const popup = document.getElementById("popup");
    const popupMessage = document.getElementById("popupMessage");

    popup.classList.remove("popup-success");

    popupMessage.textContent = message;
    if (type === 'success') {
        popup.classList.add("popup-success");
    } else {
        popup.classList.remove("popup-success");
    }

    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
    }, 2000);
}

function editAvatar() {
    document.getElementById('fileInput').click();
}

document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar').src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
});

function goToChatPage() {
    window.location.href = 'http://localhost:8080/chat.html';
}