document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const phone = urlParams.get('phone');
    if (phone) {
        document.getElementById('phone').value = phone;
    }
});

document.getElementById("regist-form").addEventListener("submit", checkForm);

async function checkForm(event) {
    event.preventDefault();
    var form = document.getElementById("regist-form");

    var Surname = form.surname ? form.surname.value : null;
    var Name = form.name ? form.name.value : null;
    var NickName = form.nickname ? form.nickname.value : null;
    var password1 = form.password1 ? form.password1.value : null;
    var password2 = form.password2 ? form.password2.value : null;
    var Phone = form.phone ? form.phone.value : null;

    console.log("Submitting registration form with data:", { Surname, Name, NickName, password1, password2, Phone });

    console.log('Form Elements:', form);
    console.log('Surname:', Surname);
    console.log('Name:', Name);
    console.log('NickName:', NickName);
    console.log('Password1:', password1);
    console.log('Password2:', password2);
    console.log('Phone', Phone);

    var fail = "";
    if (Surname === null || Surname.length < 2) {
        fail = "Фамилия должна состоять не менее чем из 2 символов.";
    } else if (Name === null || Name.length < 2) {
        fail = "Имя должно состоять не менее чем из 2 символов.";
    } else if (ContainsInvalidCharacters(Surname) || ContainsInvalidCharacters(Name)) {
        fail = "Имя и фамилия могут состоять только из латиницы и кириллицы.";
    } else if (NickName === null || NickName.length < 1) {
        fail = "Никнейм должен состоять не менее чем из 1 символа.";
    } else if (password1 === null || password1.length < 8) {
        fail = "Пароль должен состоять не менее чем из 8 символов.";
    } else if (password1 !== password2) {
        fail = "Пароли не совпадают.";
    }

    if (fail !== "") {
        document.getElementById("error").innerHTML = fail;
    } else {
        const newUser = {
            surname: Surname,
            name: Name,
            nickname: NickName,
            password: password1,
            phone: Phone
        };

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                const data = await response.json();
                // Сохраняем токен и ID пользователя в localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', data.user_id);

                // Перенаправляем на страницу чата
                window.location.href = '/chat.html';
            } else {
                const errorData = await response.json();
                console.log('Server response:', errorData);
                document.getElementById("error").innerHTML = errorData.message;
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
}

function ContainsInvalidCharacters(str) {
    const regex = /^[А-Яа-яA-Za-z]+$/;
    return !regex.test(str);
}

