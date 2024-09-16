document.getElementById("regist-form").addEventListener("submit", checkForm);

async function checkForm(event) {
    event.preventDefault();
    var form = document.getElementById("regist-form");

    var Country = form.Country.value;
    var phone = form.phone.value.split("").filter(char => char !== " ").join("");

    var fail = "";
    if (Country === "Россия" && (phone.length !== 12 || phone.substring(0, 2) !== "+7")) {
        fail = "Некорректный номер телефона.";
    } else if (Country === "Беларусь" && (phone.length !== 13 || phone.substring(0, 4) !== "+375")) {
        fail = "Некорректный номер телефона.";
    } else if (Country === "Китай" && (phone.length !== 14 || phone.substring(0, 3) !== "+86")) {
        fail = "Некорректный номер телефона.";
    } else {
        let phoneNum = phone.substring(1, phone.length);
        if (isNaN(phoneNum) || isNaN(parseFloat(phoneNum))) {
            fail = "Некорректный номер телефона.";
        }
    }

    if (fail !== "") {
        document.getElementById("error").innerHTML = fail;
    } else {
        const response = await fetch('/checkPhone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });

        if (response.ok) {
            const data = await response.json();
            console.log(data);
            if (data.exists) {
                window.location.href = '/personalDataEnterAcc.html?phone=' + encodeURIComponent(phone);
            } else {
                window.location.href = '/personalDataNewAcc.html?phone=' + encodeURIComponent(phone);
            }
        } else {
            const errorData = await response.json();
            document.getElementById("error").innerHTML = errorData.message;
        }
    }
}

function selectedCountry(country) {
    var phone = document.getElementById("phone");
    switch (country.value) {
        case "Россия":
            phone.value = "+7";
            break;
        case "Беларусь":
            phone.value = "+375";
            break;
        case "Китай":
            phone.value = "+86";
            break;
    }
}
