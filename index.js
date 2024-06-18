const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const orders = {}; // to track orders
const menu = [
    { id: 1, name: 'Margherita Pizza', price: 12 },
    { id: 2, name: 'Pepperoni Pizza', price: 15 },
    { id: 3, name: 'Veggie Pizza', price: 14 },
    { id: 4, name: 'Caesar Salad', price: 10 },
    { id: 5, name: 'Greek Salad', price: 11 },
    { id: 6, name: 'Spaghetti Carbonara', price: 13 },
    { id: 7, name: 'Lasagna', price: 14 }
];

// Define user states
const userStates = {};

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);

    // Initialize user state
    userStates[socket.id] = 'viewingMenu';

    socket.on('disconnect', () => {
        console.log('user disconnected', socket.id);
        // Remove user state on disconnect
        delete userStates[socket.id];
    });

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        if (msg === 'connected') {
            sendWelcomeMessage(socket);
        } else {
            const response = handleUserInput(socket.id, msg);
            socket.emit('chat message', response); // Send the response back to the same client
        }
    });
});

// Function to send the welcome message with options
const sendWelcomeMessage = (socket) => {
    socket.emit('chat message', 'Welcome to our restaurant! Please select an option:');
    socket.emit('chat message', 'Select 1 to Place an order');
    socket.emit('chat message', 'Select 99 to checkout order');
    socket.emit('chat message', 'Select 98 to see order history');
    socket.emit('chat message', 'Select 97 to see current order');
    socket.emit('chat message', 'Select 0 to cancel order');
};

// Function to handle user input
const handleUserInput = (userId, message) => {
    // Initialize user order history if it doesn't exist
    if (!orders[userId]) {
        orders[userId] = {
            currentOrder: [],
            orderHistory: []
        };
    }

    message = message.trim();

    switch (userStates[userId]) {
        case 'viewingMenu':
            if (message === '1') {
                userStates[userId] = 'selectingItem';
                let menuMessage = 'Here is our menu:<br><br>';
                menu.forEach(item => {
                    menuMessage += `${item.id}. ${item.name} - $${item.price}<br>`;
                });
                menuMessage += '<br>Please enter the item number to add to your order.';
                return menuMessage;
            } else if (message === '99') {
                return 'No order to place. Select 1 to place a new order.';
            } else if (message === '98') {
                return 'You have no order history.';
            } else if (message === '97') {
                return 'You have no current order.';
            } else if (message === '0') {
                return 'No order to cancel. Select 1 to place a new order.';
            } else {
                return 'Invalid input. Please enter "1" to view the menu.';
            }

        case 'selectingItem':
            if (message === '99') {
                const currentOrder = orders[userId].currentOrder;
                if (currentOrder.length === 0) {
                    return 'No order to place. Select 1 to place a new order.';
                } else {
                    orders[userId].orderHistory.push([...currentOrder]);
                    orders[userId].currentOrder = [];
                    userStates[userId] = 'viewingMenu';
                    return `Order placed: ${currentOrder.map(item => item.name).join(', ')}. Thank you! Select 1 to place a new order.`;
                }
            } else if (message === '98') {
                const orderHistory = orders[userId].orderHistory;
                if (orderHistory.length === 0) {
                    return 'You have no order history.';
                } else {
                    return `Your order history: ${orderHistory.map(order => order.map(item => item.name).join(', ')).join(' | ')}`;
                }
            } else if (message === '97') {
                const currentOrder = orders[userId].currentOrder;
                if (currentOrder.length === 0) {
                    return 'You have no current order.';
                } else {
                    return `Your current order: ${currentOrder.map(item => item.name).join(', ')}`;
                }
            } else if (message === '0') {
                orders[userId].currentOrder = [];
                userStates[userId] = 'viewingMenu';
                return 'Order cancelled. Select 1 to place a new order.';
            }

            const itemNumber = parseInt(message);
            const menuItem = menu.find(item => item.id === itemNumber);
            if (menuItem) {
                orders[userId].currentOrder.push(menuItem);
                return `${menuItem.name} has been added to your order.`;
            } else {
                return 'Invalid input. Please enter a valid item number or select another option.';
            }

        default:
            return 'Invalid input. Please select a valid option.';
    }
};

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
