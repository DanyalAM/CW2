const publicVapidKey = 'BMUvS7wmXpiSx7-b20F_Y3Kap2iD4i2cCA4OfNZSLrRur0PDvbeICrw0nz_nVGMicaHAPMCJKcsM9KqFaNeCMKU';

//because we're hosting from localhost and github
//we have to make sure the links can work everywhere
//github adds another path to the beginning which is the name of the repostiory
//so we have to include that in the path or the file isn't found
var firstCache = false;
if (window.location.href.indexOf("danyalam.github.io") > -1) {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/CW2/sw_cache.js').then(function (reg) {
                console.log("Service Worker: Registered");

                //user must be logged in to subscriber
                if (localStorage.getItem('currentUser') !== null) {
                    reg.pushManager.getSubscription().then(function (sub) {
                        if (sub === null) {
                            subscribeUser();
                            console.log('Subscribing the user');
                        }
                    })
                }

            }).catch(error => console.log(`Service Worker: Error: ${error}`))
        })
    }
} else {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('../sw_cache.js').then(function (reg) {
                console.log("Service Worker: Registered");

                if (localStorage.getItem('currentUser') !== null) {
                    reg.pushManager.getSubscription().then(function (sub) {

                        if (reg.installing) {
                            console.log("2");
                            firstCache = true;
                        }


                        if (sub === null) {
                            //if subscription is not found we must ask the user's permission
                            //to subscribe
                            subscribeUser();
                            console.log("[Service Worker] Asking for user's permission")
                        } else {

                            if (firstCache) {
                                cacheInitNotification(1);
                            } else {
                                cacheInitNotification(2);
                            }

                        }
                    })
                }


            }).then(reg => {

                // cacheInitNotification(1);
                // console.log(res);
            }).catch(error => console.log(`Service Worker: Error: ${error}`))
        })
    }
}

function cacheInitNotification(code) {
    //code 1 = loading old cache
    //code 2 = creating new cache
    var userEmail = JSON.parse(localStorage.getItem('currentUser'));

    //cache does not exist
    fetch('http://localhost:3000/collections/firstCache/' + userEmail + "-" + code)
        .then(response => {
            return response
        }).catch(error => {
            console.log("Error First Cache: " + error);
        })
}
// cacheInitNotification();

function subscribeUser() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(function (reg) {
            reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: 'BAetXY39GfoXVKtrzmz1X7nDzYYxMK9VxhDrFYkdA7dXOiaVpngpEAL2nHz8utgHRB69GTlUbTvtJUoqLNMY8iA'
            }).then(function (sub) {
                var userEmail = JSON.parse(localStorage.getItem('currentUser'));

                fetch('http://localhost:3000/collections/Subscriptions/postKeys-' + userEmail, {
                    method: 'POST',
                    body: JSON.stringify(sub),
                    headers: {
                        'content-type': 'application/json'
                    }
                }).then(() => {
                    if (firstCache) {
                        cacheInitNotification(1);
                    } else {
                        cacheInitNotification(2);
                    }
                }).catch(error => {
                    console.log("Error First Cache: " + error);
                })

            }).catch(function (e) {
                if (Notification.permission === 'denied') {
                    console.warn('Permission for notifications was denied');
                } else {
                    console.error('Unable to subscribe to push', e);
                }
            });
        })
    }
}

//Check if just registered storage exists
if (localStorage.getItem('justRegistered') !== null) {

    //if it exists then save the registration time
    var registerTime = localStorage.getItem('justRegistered');
    var oneMinute = 1000 * 60; //one minute

    //if the register time was more than a minute ago
    //delete the registeration storage item
    if (minuteChecker(registerTime, oneMinute)) {
        localStorage.removeItem('justRegistered');
    }
}

//if a minute has passed from the old time then return true
function minuteChecker(oldTime, timeDifference) {
    var minutePassed = true;
    if (new Date().getTime() - oldTime < timeDifference) {
        minutePassed = false;
    }
    return minutePassed;
}

var userAccounts = JSON.parse(localStorage.getItem('userInfo'));
var servicesProvided = [];

var registerForm = document.getElementById('register-form');
var passwordErrorHolder = document.getElementsByClassName('password-error-holder')[0];
var loginForm = document.getElementById('login-form');
var productsElement = document.getElementsByClassName('products')[0];
var userPageElement = document.getElementsByClassName('user-page')[0];

if (registerForm != null) {
    //Registration validation
    var registerForm = new Vue({
        el: '#register-form',
        data: {
            allCorrect: [],
            nameError: false,
            nameErrorText: "",
            passwordError: false,
            passwordErrorText: "",
            passwordAgainError: false,
            passwordAgainErrorText: "",
            emailError: false,
            emailErrorText: "",
            userTypeError: false,
            userTypeErrorText: "",
            passwordAgain: null,

            registerInfo: {
                name: null,
                password: null,
                email: null,
                userType: null,
                userID: 0,
                userCrumbs: [],
                userProducts: []
            },
            emails: []
        },
        methods: {
            checkForm: function (event) {

                //console.log(event);
                this.allCorrect = [];
                var found = false;
                fetch('http://localhost:3000/collections/Users/' + this.registerInfo.email)
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        if (data.length > 0) {
                            found = true
                        }

                        //If the user hasn't entered a name
                        //Prompt them to do so
                        if (!this.registerInfo.name) {
                            this.nameErrorText = "Please enter your name";
                            this.nameError = true;
                        } else {
                            this.nameError = false;
                            this.nameErrorText = "";
                            this.allCorrect.push(true);
                        }

                        //If the user hasn't entered a password
                        //Give error message
                        if (!this.registerInfo.password) {
                            this.passwordErrorText = "Please enter a password";
                            this.passwordError = true;
                        } else if (!this.validPassword(this.registerInfo.password)) {
                            //If password doesn't match the regex definition
                            this.passwordErrorText = "Please choose a stronger password";
                            this.passwordError = true;
                            errorMessageBox.passwordWrong = true;
                        } else {
                            //If password is acceptable
                            this.passwordErrorText = "";
                            this.passwordError = false;
                            errorMessageBox.passwordWrong = false;
                            this.allCorrect.push(true);
                        }

                        //If the user hasn't entered a password again
                        //Give error message
                        if (!this.passwordAgain) {
                            this.passwordAgainErrorText = "Please enter your password again";
                            this.passwordAgainError = true;
                        } else if (this.passwordAgain != this.registerInfo.password) {
                            //if re-enter password doesn't match password
                            this.passwordAgainErrorText = "Your passwords do not match!"
                            this.passwordAgainError = true;
                        } else {
                            //if re-enter password is correctly written
                            this.passwordAgainErrorText = "";
                            this.passwordAgainError = false;
                            this.allCorrect.push(true);
                        }

                        //If the user hasn't entered an email
                        //Give error message
                        if (!this.registerInfo.email) {
                            this.emailErrorText = "Please enter an email";
                            this.emailError = true;
                        } else if (!this.validEmail(this.registerInfo.email)) {
                            //if email doesn't match the regex definition
                            this.emailErrorText = "Please enter a valid email";
                            this.emailError = true;
                        } else if (found) {
                            //if email already exists
                            this.emailErrorText = "This email is already in use";
                            this.emailError = true;
                        } else {
                            //if email is correctly written
                            this.emailErrorText = "";
                            this.emailError = false;
                            this.allCorrect.push(true);
                        }

                        //If the user hasn't selected an option
                        //Give error message
                        if (!this.registerInfo.userType) {
                            this.userTypeErrorText = "Please select an option";
                            this.userTypeError = true;
                        } else {
                            this.userTypeErrorText = "";
                            this.userTypeError = false;
                            this.allCorrect.push(true);
                        }

                        //If all information is correctly entered
                        //Push the user information to localstorage
                        if (this.allCorrect.length >= 5) {
                            this.registerInfo.email = this.registerInfo.email.toLowerCase();

                            var justRegistered = (new Date()).getTime();
                            localStorage.setItem('justRegistered', justRegistered);

                            var final = JSON.stringify(this.registerInfo);

                            fetch('http://localhost:3000/addUser', {
                                method: 'POST',
                                mode: 'cors',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: final
                            }).then(function (response) {
                                if (response.status == 200) {
                                    //if hosted through github
                                    if (window.location.href.indexOf("danyalam.github.io") > -1) {
                                        window.location.replace("/CW2/page/login.html");
                                    } else {
                                        window.location.replace("/page/login.html");
                                    }
                                } else {
                                    alert("Unknown Error - Please Inform Support");
                                }

                            })
                        }
                    }).catch(error => {
                        console.log(error)
                    })

                event.preventDefault();
            },
            validEmail: function (email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            },
            validPassword: function (password) {
                var tester = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
                return tester.test(password);
            },
            emailExists: function (email) {
                //if the email already is in use return true
                var found = false;



                //danyal@hotmail.com

            }
        },
    })
}

if (passwordErrorHolder != null) {
    //Custom error box that appears
    //When password is incorrect
    var errorMessageBox = new Vue({
        el: '.password-error-holder',
        data: {
            passwordWrong: false,
            requirements: ["one digit", "one lowercase", "one uppercase", "be 8 characters long"]
        }
    })
}

if (loginForm != null) {
    //Login Validation
    var loginForm = new Vue({
        el: '#login-form',
        data: {
            registrationSuccess: false,
            loginEmail: null,
            loginPassword: null,
            incorrectInfo: false,

            emailErrorText: "",
            emailError: false,
            passwordErrorText: "",
            passwordError: false
        },
        mounted() {
            //on page load do this
            this.newlyRegistered();
        },
        methods: {
            checkLogin: function (e) {

                var found = false;
                fetch('http://localhost:3000/collections/' + this.loginEmail + "-" + this.loginPassword)
                    .then(response => {
                        return response.json()
                    })
                    .then(data => {
                        if (data.length > 0) {
                            found = true
                        }

                        if (!this.loginEmail) {
                            this.emailErrorText = "Please enter your email";
                            this.emailError = true;
                            this.incorrectInfo = false;
                        } else if (!this.validEmail(this.loginEmail)) {
                            //if email doesn't match the regex definition
                            this.emailErrorText = "Please enter a valid email";
                            this.emailError = true;
                            this.incorrectInfo = false;
                        } else {
                            this.emailErrorText = "";
                            this.emailError = false;
                            this.incorrectInfo = false;
                        }

                        if (!this.loginPassword) {
                            this.passwordErrorText = "Please enter your password";
                            this.passwordError = true;
                            this.incorrectInfo = false;
                        } else {
                            this.passwordErrorText = "";
                            this.passwordError = false;
                            this.incorrectInfo = false;
                        }

                        //if both email and password are entered
                        if (this.loginPassword && this.loginEmail) {
                            if (!found) {
                                this.incorrectInfo = true;
                            } else {
                                this.incorrectInfo = false;
                                localStorage.setItem('currentUser', JSON.stringify(this.loginEmail.toLowerCase()));

                                if (window.location.href.indexOf("danyalam.github.io") > -1) {
                                    window.location.replace("/CW2/page/myAccount.html");
                                } else {
                                    window.location.replace("/page/myAccount.html");
                                }
                            }
                        }

                    }).catch(error => {
                        console.log(error)
                    })

                e.preventDefault();
            },
            newlyRegistered: function () {
                if (localStorage.getItem("justRegistered") !== null) {
                    this.registrationSuccess = true;
                }
            },
            validEmail: function (email) {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            }
        }
    })
}


if (productsElement != null) {
    // Products Page
    var ourProducts = new Vue({
        el: '.products',
        mounted() {
            this.showProducts();

        },
        data: function () {
            return {
                course: [],
                productsToDisplay: [],
                avgRating: 0,
                run: false,
                crumbFound: false,
                alreadyRated: false,
                sortSelected: '',
                ratingErrorMsg: '',
            }
        },
        methods: {
            showProducts: function () {
                fetch("http://localhost:3000/collections/Products")
                    .then(response => {
                        return response.json()
                    }).then(data => {
                        this.course = data;

                        if (this.sortSelected == 1) {
                            //sort alphabetically A-Z
                            this.course.sort((a, b) => a.Topic.localeCompare(b.Topic));
                        } else if (this.sortSelected == 2) {
                            //otherwise is option 2 is selected 
                            //sort alphabetically Z-A
                            this.course.sort((a, b) => b.Topic.localeCompare(a.Topic));
                        } else if (this.sortSelected == 3) {
                            //otherwise if option 3 is selected
                            //sort by price high to low
                            this.course.sort(function (a, b) { return b.Price - a.Price });
                        }
                        else if (this.sortSelected == 4) {
                            //otherwise if option 4 is selected
                            //sort by price low to high
                            this.course.sort(function (a, b) { return a.Price - b.Price });
                        } else if (this.sortSelected == 5) {
                            //if option 5 is selected
                            //sort by best reviews to worse 
                            this.course.sort(function (a, b) { return b.AvgRating - a.AvgRating });
                        }
                    })
            },
            likeProduct: function (index, prodID) {
                //index in the rating number they want to give
                //prodID is the mongoDB assigned ID of the product
                //console.log()
                //get the current logged in user's email from localstorage
                var currentUser = JSON.parse(localStorage.getItem('currentUser'));
                var found = false;

                //if user is logged in (currentUser isn't undefined)
                if (currentUser != undefined) {

                    //send a request to the server to retrieve user's information by their email
                    fetch('http://localhost:3000/collections/Users/' + currentUser)
                        .then(response => {
                            return response.json()
                        })
                        .then(data => {
                            //check if product ID has already been rated by current user
                            //this will allow us to know if we have to update the rating or
                            //treat it as a brand new one
                            for (var i = 0; i < data[0].userCrumbs.length; i++) {

                                if (data[0].userCrumbs[i] == prodID._id) {
                                    console.log("already liked");
                                    found = true;
                                    break;
                                }
                            }

                            if (found) {
                                var calculatedAvg = this.calculateAverageRating(prodID, index, "updateRanking", data[0]._id);
                                fetch('http://localhost:3000/collections/Users/' + data[0]._id + "-" + "updateRanking", {
                                    method: 'PUT',
                                    mode: 'cors',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        "productID": prodID._id,
                                        "givenRating": index + 1,
                                        "avgRating": calculatedAvg[0],
                                        "oldRating": calculatedAvg[1]
                                    })
                                }).then(response => {
                                    //if response == ok show user a success message
                                    if (response.status == 200) {
                                        this.ratingErrorMsg = "Your previous rating has been updated!";
                                        this.alreadyRated = true;
                                        setTimeout(() => { this.alreadyRated = false }, 3000);

                                        this.showProducts();
                                    } else {
                                        //otherwise tell them there was an error
                                        this.ratingErrorMsg = "We couldn't save your rating right now!";
                                        this.alreadyRated = true;
                                        setTimeout(() => { this.alreadyRated = false }, 3000);
                                    }
                                })
                            } else {
                                var calculatedAvg = this.calculateAverageRating(prodID, index, "newRanking", data[0]._id);
                                fetch('http://localhost:3000/collections/Users/' + data[0]._id + "-" + "newRanking", {
                                    method: 'PUT',
                                    mode: 'cors',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ "productID": prodID._id, "givenRating": index + 1, "avgRating": calculatedAvg[0] })
                                }).then(response => {
                                    //if response == ok show user a success message
                                    if (response.status == 200) {
                                        this.ratingErrorMsg = "You've successfully rated this product!";
                                        this.alreadyRated = true;
                                        setTimeout(() => { this.alreadyRated = false }, 3000);

                                        this.showProducts();
                                    } else {
                                        //otherwise tell them there was an error
                                        this.ratingErrorMsg = "We couldn't save your rating right now! Code 1";
                                        this.alreadyRated = true;
                                        setTimeout(() => { this.alreadyRated = false }, 3000);
                                    }
                                }).catch(error => {
                                    console.log(error);
                                    this.ratingErrorMsg = "We couldn't save your rating right now! Code 2";
                                    this.alreadyRated = true;
                                    setTimeout(() => { this.alreadyRated = false }, 3000);
                                })
                            }

                            //user's current rating and the ID of the product they've related
                        })

                } else {
                    //otherwise user isn't logged in
                    this.ratingErrorMsg = "You need to login to rate products";
                    this.alreadyRated = true;
                    setTimeout(() => { this.alreadyRated = false }, 3000);
                }
            },
            sortUpdated: function () {
                //if first sort is selected
                this.showProducts();
            },
            calculateAverageRating: function (productData, newRating, rankType, userID) {

                var returnValue = [];

                if (rankType == "newRanking") {
                    //setting the rating value that needs to change (5,4,3,2,1?)
                    var updateSection = ("rated" + (newRating + 1));
                    productData.Ratings[updateSection]++;

                    //multiply all ratings numbers by their rated value
                    //and divide them by all the ratings combined 
                    //this will give a float average so we have to convert to a whole number
                    returnValue[0] = Math.floor((5 * productData.Ratings['rated5']
                        + 4 * productData.Ratings['rated4']
                        + 3 * productData.Ratings['rated3']
                        + 2 * productData.Ratings['rated2']
                        + 1 * productData.Ratings['rated1'])
                        / (productData.Ratings['rated5']
                            + productData.Ratings['rated4']
                            + productData.Ratings['rated3']
                            + productData.Ratings['rated2']
                            + productData.Ratings['rated1']));
                } else if (rankType == "updateRanking") {
                    //filtering out the old ranking of the current user so we can update it
                    var result = productData.RatingHistory.filter(ratings => ratings.raterID == userID);

                    //setting the rating value that needs to change (5,4,3,2,1?)
                    var updateSection = ("rated" + (newRating + 1));
                    productData.Ratings[updateSection]++;

                    //removing the previous star value so we can calculate an average with the correct numbers
                    var removeSection = ("rated" + result[0].givenRating);
                    productData.Ratings[removeSection]--;

                    //multiply all ratings numbers by their rated value
                    //and divide them by all the ratings combined 
                    //this will give a float average so we have to convert to a whole number
                    returnValue[0] = Math.floor((5 * productData.Ratings['rated5']
                        + 4 * productData.Ratings['rated4']
                        + 3 * productData.Ratings['rated3']
                        + 2 * productData.Ratings['rated2']
                        + 1 * productData.Ratings['rated1'])
                        / (productData.Ratings['rated5']
                            + productData.Ratings['rated4']
                            + productData.Ratings['rated3']
                            + productData.Ratings['rated2']
                            + productData.Ratings['rated1']));

                    returnValue[1] = result[0].givenRating;
                }
                return returnValue;
            }
        },
    });
}

if (userPageElement != null) {
    var userPage = new Vue({
        el: '.user-page',
        data: {
            username: '',
            userID: '',
            currentUserIsProvider: false,
            providerProducts: [],
            allCorrect: [],

            subjectInfo: {
                Topic: null,
                Location: null,
                Price: 100,
                Time: 0,
                Duration: 0,
                AvgRating: 0,
                Raters: 0,
                Ratings: {
                    'rated5': 0,
                    'rated4': 0,
                    'rated3': 0,
                    'rated2': 0,
                    'rated1': 0,
                },
                RatingHistory: [

                ],
                Image: null,
            },

            topicError: false,
            topicErrorText: '',
            priceError: false,
            priceErrorText: '',
            locationError: false,
            locationErrorText: '',
            timeError: false,
            timeErrorText: '',
            durationError: false,
            durationErrorText: '',
            imageError: false,
            imageErrorText: '',
            imageSelected: '',
            allowDisallow: true,
            showSaveButton: [],
            idValue: [],
            newValTopic: [],
            newValPrice: [],
            newValLocation: [],
            newValTime: [],
            newValDuration: [],

        },
        mounted() {
            this.confirmName();
        },
        methods: {
            verifyLesson: function (e) {
                if (!this.subjectInfo.Topic) {
                    this.topicError = true;
                    this.topicErrorText = "Please enter the topic of your course";
                    this.allCorrect[0] = false;
                } else {
                    this.topicError = false;
                    this.topicErrorText = "";
                    this.allCorrect[0] = true;
                }

                if (!this.subjectInfo.Price) {
                    this.priceError = true;
                    this.priceErrorText = "Please enter the price of your course";
                    this.allCorrect[1] = false;
                } else {
                    this.priceError = false;
                    this.priceErrorText = "";
                    this.allCorrect[1] = true;
                }

                if (!this.subjectInfo.Location) {
                    this.locationError = true;
                    this.locationErrorText = "Please enter the location of your course";
                    this.allCorrect[2] = false;
                } else {
                    this.locationError = false;
                    this.locationErrorText = "";
                    this.allCorrect[2] = true;
                }

                if (!this.subjectInfo.Time) {
                    this.timeError = true;
                    this.timeErrorText = "Please choose a time length for your class";
                    this.allCorrect[3] = false;
                } else {
                    this.timeError = false;
                    this.timeErrorText = '';
                    this.allCorrect[3] = true;
                }

                if (!this.subjectInfo.Duration) {
                    this.durationError = true;
                    this.durationErrorText = "Please choose the length of your full course";
                    this.allCorrect[4] = false;
                } else {
                    this.durationError = false;
                    this.durationErrorText = '';
                    this.allCorrect[4] = true;
                }

                if (!this.imageSelected) {
                    this.imageError = true;
                    this.imageErrorText = "Please select an image for your product";
                    this.allCorrect[5] = false;
                } else {
                    this.imageError = false;
                    this.imageErrorText = "";
                    this.allCorrect[5] = true;
                }

                if (this.allCorrect.filter(item => item === true).length > 5) {

                    //number has to be parsed or it saves as string
                    this.subjectInfo.Price = parseInt(this.subjectInfo.Price);
                    this.subjectInfo.Topic = this.formatInfo(this.subjectInfo.Topic);
                    this.subjectInfo.Location = this.formatInfo(this.subjectInfo.Location);
                    this.subjectInfo.Image = this.imageSelected;

                    fetch('http://localhost:3000/collections/Products/' + this.userID, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.subjectInfo)
                    }).then(function (response) {
                        if (response.status == 200) {
                            //call user show products function
                            location.reload();
                        } else {
                            alert("Unknown Error - Please Inform Support");
                        }

                    }).catch(error => {
                        console.log(error)
                    })

                }
                e.preventDefault();
            },
            confirmName: function () {
                if (localStorage.getItem('currentUser') !== null) {
                    var currentUserEmail = JSON.parse(localStorage.getItem('currentUser')); //current user email

                    //get the user's details by current logged in user
                    fetch('http://localhost:3000/collections/Users/' + currentUserEmail)
                        .then(response => {
                            return response.json()
                        }).then(data => {
                            //update username on user's page
                            this.username = data[0].name;
                            this.userID = data[0]._id;
                            if (data[0].userType == 2) {
                                this.currentUserIsProvider = true;
                                this.providerProducts = data[0].userProducts;
                                //this.productIds = data[0].userProducts;
                                this.displayUserLessons(data[0].userProducts);
                            } else {
                                this.currentUserIsProvider = false;
                            }
                        }).catch(error => {
                            this.username = "unknown"
                        })

                }
            },
            displayUserLessons: function (allProductId) {
                //gets an array of all the lessons the current user provides 
                fetch('http://localhost:3000/collections/Products/allProvided/' + this.userID)
                    .then(response => {
                        return response.json()
                    }).then(data => {
                        this.providerProducts = data;
                    })
            },
            removeProduct: function (removalPos) {
                var productID = this.providerProducts[removalPos]._id;

                fetch('http://localhost:3000/collections/Products/' + productID, {
                    method: 'DELETE',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "userID": this.userID })
                })
                    .then(response => {
                        return response
                    }).then(data => {
                        if (data.status == 200) {
                            console.log("Product has been removed!");
                            this.displayUserLessons();
                        } else {
                            console.log("There was an error removing product!");
                        }
                    })
            },
            editProduct: function (indx) {
                this.allowDisallow = false;
                this.showSaveButton[indx] = true;
                //this.displayUserLessons();
            },
            saveProduct: function (prodID, indx, td) {

                var currentProduct = this.providerProducts[indx];

                //if valus is not empty and doesnt have only spaces then add new value
                if (this.newValTopic[indx] != undefined && this.newValTopic[indx].trim() != '') {
                    currentProduct.Topic = this.newValTopic[indx];
                }

                if (this.newValPrice[indx] != undefined && this.newValPrice[indx].trim() != '') {
                    currentProduct.Price = this.newValPrice[indx];
                }

                if (this.newValLocation[indx] != undefined && this.newValLocation[indx].trim() != '') {
                    currentProduct.Location = this.newValLocation[indx];
                }

                if (this.newValTime[indx] != undefined && this.newValTime[indx].trim() != '') {
                    currentProduct.Time = this.newValTime[indx];
                }

                if (this.newValDuration[indx] != undefined && this.newValDuration[indx].trim() != '') {
                    currentProduct.Duration = this.newValDuration[indx];
                }

                //removing id from the body we want to send as we're not updating the id
                delete currentProduct._id;

                fetch('http://localhost:3000/collections/updateLesson/Products/' + prodID, {
                    method: 'PUT',
                    mode: 'cors',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(currentProduct)
                })
                    .then(response => {
                        return response
                    }).then(data => {
                        if (data.status == 200) {
                            console.log("course successfully updated!");
                        } else {
                            console.log("there was an error: code 1");
                        }
                    }).catch(error => {
                        if (error) {
                            console.log("there was a problem saving your course: code 2");
                        }
                    })


                this.displayUserLessons();
                this.allowDisallow = true;
                this.showSaveButton[indx] = false;

            },
            formatInfo: function (s) {
                return s.replace(/^.{1}/g, s[0].toUpperCase());
            }
        }
    })
}

//Hamburger-Menu
//If button is clicked and Nav bar is not open then the nav bar opens
//If the nav bar is already open then button click will close it
var pageHeader = new Vue({
    el: 'header',
    data: {
        loggedIn: false,
        buttonLinkRegister: "../page/register.html",
        buttonLinkLogin: "../page/login.html",
        buttonLinkAccount: "../page/myAccount.html",
        searchedQuery: '',
        currentSearch: window.location.search,
        listOfWords: [],
        searchApplied: false,
        curSearch: '',
    },
    mounted() {
        //on page load do this
        this.isLoggedIn();
    },
    methods: {
        menuClicked: function () {
            if (menuBar.show) {
                menuBar.show = false;
            } else {
                menuBar.show = true;
            }
        },
        isLoggedIn: function () {
            if (localStorage.getItem('currentUser') != undefined) {
                this.loggedIn = true;
            }
        },
        logout: function () {
            if (localStorage.getItem('currentUser') != undefined) {
                localStorage.removeItem('currentUser');
                this.loggedIn = false;
            }
        }
    }
})

//THIS SCRIPT FROM THIS POINT FORWARD IS COSEMETIC ONLY IT SERVES 
//NO PURPOSE OTHER THAN CONTROLLING THE BEHAVIOUR OF THE NAVIGATION MENU

//This is a directive to check if user click outside of the navigation menu
Vue.directive('click-outside', {
    bind: function (el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
            //if the click is outside the nav bar and its children then proceed
            //otherwise nothing happens
            if (!(el == event.target || el.contains(event.target))) {
                //If the click is not on the hamburger menu or its child (the icon) then proceed
                //or nothing happens
                if (!(event.target == pageHeader.$refs.menuButton || pageHeader.$refs.menuButton.contains(event.target))) {
                    vnode.context[binding.expression](event.target);
                };
            }
        }
        document.body.addEventListener('click', el.clickOutsideEvent)
    },
    unbind: function (el) {
        document.body.removeEventListener('click', el.clickOutsideEvent)
    },
});


//Navigation Bar
//At the start it will always be false so the nav var will not be open
var menuBar = new Vue({
    el: '.scripted-menu',
    data: {
        show: false,
    },
    methods: {
        clickedOutside: function (event) {
            this.show = false;
        }
    }

});

