const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const orderRouter = require("./routes/orderRoute");
const paymentRouter = require("./routes/paymentRoute");
const productRouter = require("./routes/productRoute");
const userRouter = require("./routes/userRoute");
const tokenLedgerRouter = require("./routes/tokenLedgerRoute");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/ledger', tokenLedgerRouter);
app.use('/api/order', orderRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/product', productRouter);
app.use('/api/user', userRouter);

// deployment
__dirname = path.resolve();
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.use((err, req, res, next) => {
  if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || err.message.includes('buffering timed out')) {
    console.warn('[AI Studio] Database offline — returning mock empty response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

module.exports = app;
