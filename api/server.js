const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

const userController = require("./controllers/UserController");
const productController = require("./controllers/ProductController");
const saleController = require('./controllers/SaleController');
const categoryController = require('./controllers/CategoryController');
const customerController = require('./controllers/CustomerController');
const rentalDaysController = require('./controllers/RentalDaysController');
const accountController = require('./controllers/AccountController');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/uploads', express.static('uploads'));
app.use('/shipping', express.static('shipping'));
app.use('/returns', express.static('returns'));
app.use('/payments', express.static('payments'));


app.use('/user', userController);
app.use('/product', productController);
app.use('/api/sale', saleController);
app.use('/api', categoryController);
app.use('/api', customerController);
app.use('/api', rentalDaysController);
app.use('/api', accountController);


app.listen(3001);