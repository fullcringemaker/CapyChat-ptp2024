document.getElementById("login-form").addEventListener("submit", checkForm);

async function checkForm(event) {
    event.preventDefault();
    var form = document.getElementById("login-form");

    var NickName = form.nickname.value;
    var password = form.password.value;

    var fail = "";
    if (NickName.length < 1) {
        fail = "Введите никнейм.";
    } else if (password.length < 8) {
        fail = "Пароль должен состоять не менее чем из 8 символов.";
    }

    if (fail != "") {
        document.getElementById("error").innerHTML = fail;
    } else {
        const credentials = {
            nickname: NickName,
            password: password
        };

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                localStorage.setItem('user_id', data.user_id);
                window.location.href = '/chat.html';
            } else {
                const errorData = await response.json();
                document.getElementById("error").innerHTML = errorData.message;
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
    }
}
