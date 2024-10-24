Sure! Below is a comprehensive guide to implement the backend and frontend for the transaction dashboard, including APIs for data fetching, statistics, and charts using Node.js and React.js.

### Backend Implementation (Node.js)

1. **Setup the Environment**
   - Create a new Node.js project.
   - Install required packages:
     ```bash
     npm init -y
     npm install express mongoose axios cors
     ```

2. **Database Model**
   - Create a model for transactions in MongoDB.

   ```javascript
   // models/Transaction.js
   const mongoose = require('mongoose');

   const transactionSchema = new mongoose.Schema({
       id: String,
       title: String,
       description: String,
       price: Number,
       dateOfSale: Date,
       category: String,
   });

   module.exports = mongoose.model('Transaction', transactionSchema);
   ```

3. **Setup Express Server**
   - Create the Express server and define API endpoints.

   ```javascript
   // server.js
   const express = require('express');
   const mongoose = require('mongoose');
   const axios = require('axios');
   const Transaction = require('./models/Transaction');
   const cors = require('cors');

   const app = express();
   app.use(cors());
   app.use(express.json());

   const PORT = process.env.PORT || 5000;
   const MONGO_URI = 'YOUR_MONGODB_URI'; // Replace with your MongoDB URI

   mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

   // API to initialize the database
   app.post('/api/init', async (req, res) => {
       try {
           const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
           const transactions = response.data.map(item => ({
               id: item.id,
               title: item.title,
               description: item.description,
               price: item.price,
               dateOfSale: new Date(item.dateOfSale),
               category: item.category,
           }));
           await Transaction.insertMany(transactions);
           res.status(200).send({ message: 'Database initialized successfully' });
       } catch (error) {
           res.status(500).send({ error: 'Failed to initialize database' });
       }
   });

   // API to list transactions
   app.get('/api/transactions', async (req, res) => {
       const { page = 1, perPage = 10, search = '', month } = req.query;

       const startDate = new Date(new Date().getFullYear(), month - 1, 1);
       const endDate = new Date(new Date().getFullYear(), month, 0);

       const query = {
           dateOfSale: { $gte: startDate, $lt: endDate },
           $or: [
               { title: new RegExp(search, 'i') },
               { description: new RegExp(search, 'i') },
               { price: { $regex: search } }
           ]
       };

       const transactions = await Transaction.find(query)
           .skip((page - 1) * perPage)
           .limit(Number(perPage));
       const totalCount = await Transaction.countDocuments(query);

       res.send({ transactions, totalCount });
   });

   // API for statistics
   app.get('/api/statistics', async (req, res) => {
       const { month } = req.query;
       const startDate = new Date(new Date().getFullYear(), month - 1, 1);
       const endDate = new Date(new Date().getFullYear(), month, 0);

       const soldItemsCount = await Transaction.countDocuments({ dateOfSale: { $gte: startDate, $lt: endDate } });
       const totalSales = await Transaction.aggregate([
           { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
           { $group: { _id: null, total: { $sum: "$price" } } }
       ]);
       const totalAmount = totalSales[0]?.total || 0;

       const totalItems = await Transaction.countDocuments({});
       const notSoldItemsCount = totalItems - soldItemsCount;

       res.send({
           totalAmount,
           soldItems: soldItemsCount,
           notSoldItems: notSoldItemsCount
       });
   });

   // API for bar chart
   app.get('/api/bar-chart', async (req, res) => {
       const { month } = req.query;
       const startDate = new Date(new Date().getFullYear(), month - 1, 1);
       const endDate = new Date(new Date().getFullYear(), month, 0);

       const priceRanges = [
           { label: '0 - 100', min: 0, max: 100 },
           { label: '101 - 200', min: 101, max: 200 },
           { label: '201 - 300', min: 201, max: 300 },
           { label: '301 - 400', min: 301, max: 400 },
           { label: '401 - 500', min: 401, max: 500 },
           { label: '501 - 600', min: 501, max: 600 },
           { label: '601 - 700', min: 601, max: 700 },
           { label: '701 - 800', min: 701, max: 800 },
           { label: '801 - 900', min: 801, max: 900 },
           { label: '901 - above', min: 901 }
       ];

       const results = await Promise.all(priceRanges.map(async (range) => {
           const count = await Transaction.countDocuments({
               price: { $gte: range.min, ...(range.max && { $lt: range.max }) },
               dateOfSale: { $gte: startDate, $lt: endDate }
           });
           return { label: range.label, count };
       }));

       res.send(results);
   });

   // API for pie chart
   app.get('/api/pie-chart', async (req, res) => {
       const { month } = req.query;
       const startDate = new Date(new Date().getFullYear(), month - 1, 1);
       const endDate = new Date(new Date().getFullYear(), month, 0);

       const results = await Transaction.aggregate([
           { $match: { dateOfSale: { $gte: startDate, $lt: endDate } } },
           { $group: { _id: "$category", count: { $sum: 1 } } }
       ]);

       res.send(results);
   });

   // Combined API
   app.get('/api/combined-stats', async (req, res) => {
       const { month } = req.query;
       const [stats, barData, pieData] = await Promise.all([
           axios.get(`http://localhost:${PORT}/api/statistics?month=${month}`),
           axios.get(`http://localhost:${PORT}/api/bar-chart?month=${month}`),
           axios.get(`http://localhost:${PORT}/api/pie-chart?month=${month}`),
       ]);

       res.send({
           stats: stats.data,
           barData: barData.data,
           pieData: pieData.data
       });
   });

   app.listen(PORT, () => {
       console.log(`Server is running on port ${PORT}`);
   });
   ```

### Frontend Implementation (React.js)

1. **Set Up React Project**
   - Create a new React project using Create React App.
   ```bash
   npx create-react-app transactions-app
   cd transactions-app
   npm install axios chart.js react-chartjs-2
   ```

2. **Create Components**

   **App Component**

   ```javascript
   // src/App.js
   import React, { useState, useEffect } from 'react';
   import axios from 'axios';
   import TransactionsTable from './TransactionsTable';
   import TransactionsStatistics from './TransactionsStatistics';
   import BarChart from './BarChart';
   import PieChart from './PieChart';

   const App = () => {
       const [month, setMonth] = useState(3); // Default to March
       const [combinedData, setCombinedData] = useState({});

       const fetchCombinedData = async () => {
           const response = await axios.get(`/api/combined-stats?month=${month}`);
           setCombinedData(response.data);
       };

       useEffect(() => {
           fetchCombinedData();
       }, [month]);

       return (
           <div>
               <h1>Transactions Dashboard</h1>
               <label>
                   Select Month:
                   <select value={month} onChange={e => setMonth(e.target.value)}>
                       {Array.from({ length: 12 }, (_, i) => (
                           <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                       ))}
                   </select>
               </label>
               <TransactionsTable month={month} />
               <TransactionsStatistics stats={combinedData.stats} />
               <BarChart data={combinedData.barData} />
               <PieChart data={combinedData.pieData} />
           </div>
       );
   };

   export default App;
   ```

   **Transactions Table Component**

   ```javascript
   // src/TransactionsTable.js
   import React, { useEffect, useState } from 'react';
   import axios from 'axios';

   const TransactionsTable = ({ month }) => {
       const [transactions, setTransactions] = useState([]);
       const [search, setSearch] = useState