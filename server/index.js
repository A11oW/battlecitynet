// Подключаем необходимые модули
var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server);


/*var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

server.listen(80);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('my other event', function (data) {
        console.log(data);
    });
});*/


// Воспользуемся функциями express для отдачи статики
app.use(express.static(__dirname + '/public'));
// Обозначим порт для приложения и вебсокета
app.listen(3000);
// Уровень вывода лога у socket.io для отладки можно оставить по умолчению 3, потом оно не нужно
io.set('log level', 3);
// Я изменил стандартное имя ресурса, но можно оставить стандартный /socket.io
io.set('resource', '/api');

// При установки соединения через вебсокеты сработает данное событие
io.sockets.on('connection', function (socket) {
    // Выведем в консоль сообщение о подключении пользователя с его ID и IP адресом
    console.info('%s: %s - connected', socket.id.toString(), socket.handshake.address.address);

    /*socket.on('disconnect', function () {
        // Выводим сообщение об отключении пользователя
        console.log('%s: %s - disconnected', socket.id.toString(), socket.handshake.address.address);
    });*/
});

/*
// Объявим переменные для счётчиков, для глобализации их вынесем в начало, так же создадим глобальный объект коллекции игр
var countGames = onlinePlayers = onlineGames = 0,
    countPlayers = [],
    Game = new TicTacToe();
// Установим размеры поля, возможно потом сделаем это чтобы задавали наши игроки
Game.x = Game.y = 6; // Default: 6
// Необходимое кол-во занятых подряд клеток для победы
Game.stepsToWin = 4; // Default: 4
// При установки соединения через вебсокеты сработает данное событие
io.sockets.on('connection', function (socket) {
    // Выведем в консоль сообщение о подключении пользователя с его ID и IP адресом
    console.log('%s: %s - connected', socket.id.toString(), socket.handshake.address.address);
    // Вызовем событие у клиента с именем stats и передадим в него данные статистики
    io.sockets.emit('stats', [
        'Всего игр: ' + countGames,
        'Уникальных игроков: ' + Object.keys(countPlayers).length,
        'Сейчас игр: ' + onlineGames,
        'Сейчас игроков: ' + onlinePlayers
    ]);
    // Поставим вызов этого события в интервале 5 секунд, для обновления данных
    setInterval(function() {
        io.sockets.emit('stats', [
            'Всего игр: ' + countGames,
            'Уникальных игроков: ' + Object.keys(countPlayers).length,
            'Сейчас игр: ' + onlineGames,
            'Сейчас игроков: ' + onlinePlayers
        ]);
    }, 5000);
    // Вызовем функции старта игры, как ID пользователя возьмём уникальный вебсокет ID это обычный md5 хэш
    Game.start(socket.id.toString(), function(start, gameId, opponent, x, y){
        // В callback'е мы получим стартовала ли игра или нет, остальные параметры зависят от первого
        // Если игра стартовала то они будут переданы, иначе они не нужны и будут null
        if(start) {
            // Подключем к игрока в отдельную комнату её ID будет ID игры
            // Сами комнаты это стандартная плюшка socket.io
            socket.join(gameId);
            // Подключим к комнате(игре) нашего соперника обратившись к нему через вебсокеты
            io.sockets.socket(opponent).join(gameId);
            // Вызовем события у игрока о старте и параметры игры
            socket.emit('ready', gameId, 'X', x, y);
            // Вызовем событие у соперника
            io.sockets.socket(opponent).emit('ready', gameId, 'O', x, y);
            // Соберём статистику увеличив счётчики всех игр и запущенных игр
            countGames++;
            onlineGames++;
        } else {
            // ожидает соперника, вызовем события ожидания у игрока
            io.sockets.socket(socket.id).emit('wait');
        }
        // Если пользователя ещё нет в объекте уникальных ip то добавим для статистики
        if(countPlayers[socket.handshake.address.address] == undefined) countPlayers[socket.handshake.address.address] = true;
        // Счётчик игроков в сети
        onlinePlayers++;
    });

    // Событие сделанного хода игроком
    socket.on('step', function (gameId, id) {
        // Парсим из ID элемента координаты XxY
        var coordinates = id.split('x');
        // Передаём все данные в функцию коллекции игр, которая служит proxy для вызова аналогичной функции в самой игре
        Game.step(gameId, parseInt(coordinates[0]), parseInt(coordinates[1]), socket.id.toString(), function(win, turn) {
            // Она нам вернёт значения ходе, если победитель, а так же чем ходили всё передадим как есть в событие пользователям
            // На этот раз обратите внимание используем in() эта функция отправляет сообщения всем пользователям комнаты
            io.sockets.in(gameId).emit('step', id, turn, win);
            // Если есть победитель или ничья
            if(win) {
                // Завершаем игру и удаляем все данные, не будем забивать память
                Game.end(socket.id.toString(), function(gameId, opponent) {
                    // После удаления игры мы можем вывести из комнаты игрока
                    socket.leave(gameId);
                    // А так же соперника
                    io.sockets.socket(opponent).leave(gameId);
                });
            }
        });
    });

    // В случаи обрыва соединения или закрытия вкладки пользователем или просто конца игры
    socket.on('disconnect', function () {
        // Если один из игроков отключился, посылаем об этом сообщение второму
        // Отключаем обоих от игры и удаляем её, освобождаем память
        Game.end(socket.id.toString(), function(gameId, opponent) {
            // Посылаем сопернику что игрок отключён, причём наша функция Game.end возвращает независимо от того кто прервал игру, ID соперника
            io.sockets.socket(opponent).emit('exit');
            // Отключаем пользователя из комнаты
            socket.leave(gameId);
            // Отключаем соперника из комнаты
            io.sockets.socket(opponent).leave(gameId);
            // Уменьшаем счётчик запущенных игр
            onlineGames--;
        });
        // Уменьшаем счётчик играющих
        onlinePlayers--;
        // Выводим сообщение об отключении пользователя
        console.log('%s: %s - disconnected', socket.id.toString(), socket.handshake.address.address);
    });

});*/
