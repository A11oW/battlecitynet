// Объект коллекции всех игр, сердце мультиплеера, так же она единственная и главная экспортируемая функция модуля
var TicTacToe = module.exports = function() {
    // Массив id игры = объект игры
    this.games = [];
    // Массив подключённых пользователей = id игры
    this.users = [];
    // Массив пользователей ожидающих оппонентов для начало игры
    this.free = [];
    // Размеры поля
    this.x = 6;
    this.y = 6;
    // Шагов до победы
    this.stepsToWin = 4;
}
// Объект игры, в нём индивидуальные настройки каждой игры
var GameItem = function(user, opponent, x, y, stepsToWin) {
    // Ячейки игрового поля будут в виде объекта this.board[id игровой ячейки] = чем ходили
    this.board = [];
    // Игроки
    this.user = user; // X
    this.opponent = opponent; // O
    // Размеры поля
    this.x = x;
    this.y = y;
    // Шагов до победы
    this.stepsToWin = stepsToWin;
    // Кол-во сделанных ходов
    this.steps = 0;
}
TicTacToe.prototype.start = function(user, cb) {
    // Размер игрового поля и кол-во ходов для победы
    // Ищем свободные игры используем Object.keys чтобы посчитать элементы в объекте
    if(Object.keys(this.free).length > 0) {
        // Если есть ожидающие игры получаем один ID
        var opponent = Object.keys(this.free).shift();
        // Создаём игру между этими игроками
        var game = new GameItem(user, opponent, this.x, this.y, this.stepsToWin);
        // Создаём уникальный ID игры из ID игроков
        var id = user + opponent;
        // Добавляем игру в список действующих
        this.games[id] = game;
        // Добавляем игрока в общей список играющих
        this.users[user] = id;
        // Добавляем его соперника так же
        this.users[opponent] = id;
        // Используем callback функция для возврата
        cb(true, id, opponent, this.x, this.y);
    } else {
        // Пока нет, значит будем ждать
        this.free[user] = true;
        // Используем callback функция для возврата
        cb(false);
    }
}

TicTacToe.prototype.end = function(user, cb) {
    // Если пользователь стоял в очереди удаляем его от туда
    delete this.free[user];
    // Если пользователь уже был удалён выходим, значит игры уже нет
    if(this.users[user] === undefined) return;
    // Получаем ID игры в которой находится пользователь
    var gameId = this.users[user];
    // Если игра уже была удалена, выходим
    if(this.games[gameId] === undefined) return;
    // Получаем объект игры по его ID
    var game = this.games[gameId];
    // Получаем соперника из этой игры
    var opponent = (user == game.user ? game.opponent : game.user);
    // Удаляем объект игры
    delete this.games[gameId];
    // Освобождаем память
    game = null;
    // Удаляем пользователя из списка
    delete this.users[user];
    // Возвращаем ID игры и ID соперника в этой игре
    cb(gameId, opponent);
}

TicTacToe.prototype.step = function(gameId, x, y, user, cb) {
    // Данная функция служит как proxy для обращения к нужно игре из коллекции и передачи параметров в неё
    this.games[gameId].step(x, y, user, cb);
}
GameItem.prototype.step = function(x, y, user, cb) {
    // Проверяем что в этой клетке ничего нет
    if(this.board[x + 'x' + y] !== undefined) return;
    // Получаем параметры X и Y куда был сделан ход, добавляем в объект ходов на эти координаты кто пошёл
    this.board[x + 'x' + y] = this.getTurn(user);
    // Увеличиваем счётчик сделанных ходов
    this.steps++;
    // Обратный вызов у нас срабатывает после выполнения функции проверки на победителя
    cb(this.checkWinner(x, y, this.getTurn(user)), this.getTurn(user));
}

GameItem.prototype.checkWinner = function(x, y, turn) {
    // Проверка на ничью, если нет больше свободных полей
    if(this.steps == (this.x * this.y)) {
        // Ничья
        return 'none';
        // Проверка на победителя
    } else if(
    // Проверка комбинаций на победу пользователя
        this.checkWinnerDynamic('-', x, y, turn)
            || this.checkWinnerDynamic('|', x, y, turn)
            || this.checkWinnerDynamic('\\', x , y, turn)
            || this.checkWinnerDynamic('/', x, y, turn)
        ) {
        // есть победитель
        return true;
    } else {
        // нет победителя
        return false;
    }
}
GameItem.prototype.checkWinnerDynamic = function(a, x, y, turn) {
    // будем проверять динамически 4 комбинации: горизонталь, вертикаль и 2 диагонали
    // при этом мы не знаем на какой позиции текущий ход,, проверять будем во всех 4 направлениях
    var win = 1;
    switch(a) {

        // поиск по горизонтали
        case '-':
            var toLeft = toRight = true,
                min = x - this.stepsToWin, max = x + this.stepsToWin;
            min = (min < 1) ? 1 : min;
            max = (max > this.x) ? this.x : max;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toLeft && !toRight) return false;
                if(toLeft && min <= (x-i) && this.board[(x-i) + 'x' + y] == turn) { win++; } else { toLeft = false; }
                if(toRight && (x+i) <= max && this.board[(x+i) + 'x' + y] == turn) { win++; } else { toRight = false; }
            }
            break;

        // поиск по вертикали
        case '|':
            var toUp = toDown = true,
                min = y - this.stepsToWin, max = y + this.stepsToWin;
            min = (min < 1) ? 1 : min;
            max = (max > this.y) ? this.y : max;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toUp && !toDown) return false;
                if(toUp && min <= (y-i) && this.board[x + 'x' + (y-i)] == turn) { win++; } else { toUp = false; }
                if(toDown && (y+i) <= max && this.board[x + 'x' + (y+i)] == turn) { win++; } else { toDown = false; }
            }
            break;

        // поиск по диагонали сверху вниз
        case '\\':
            var toUpLeft = toDownRight = true,
                minX = x - this.stepsToWin, maxX = x + this.stepsToWin,
                minY = y - this.stepsToWin, maxY = y + this.stepsToWin;
            minX = (minX < 1) ? 1 : minX;
            maxX = (maxX > this.x) ? this.x : maxX;
            minY = (minY < 1) ? 1 : minY;
            maxY = (maxY > this.y) ? this.y : maxY;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toUpLeft && !toDownRight) return false;
                if(toUpLeft && minX <= (x-i) && minY <= (y-i) && this.board[(x-i) + 'x' + (y-i)] == turn) { win++; } else { toUpLeft = false; }
                if(toDownRight && (x+i) <= maxX && (y+i) <= maxY && this.board[(x+i) + 'x' + (y+i)] == turn) { win++; } else { toDownRight = false; }
            }
            break;

        // поиск по диагонали снизу вверх
        case '/':
            var toDownLeft = toUpRight = true,
                minX = x - this.stepsToWin, maxX = x + this.stepsToWin,
                minY = y - this.stepsToWin, maxY = y + this.stepsToWin;
            minX = (minX < 1) ? 1 : minX;
            maxX = (maxX > this.x) ? this.x : maxX;
            minY = (minY < 1) ? 1 : minY;
            maxY = (maxY > this.y) ? this.y : maxY;
            for(var i = 1; i <= this.stepsToWin; i++) {
                if(win >= this.stepsToWin) return true;
                if(!toDownLeft && !toUpRight) return false;
                if(toDownLeft && minX <= (x-i) && (y+i) <= maxY && this.board[(x-i) + 'x' + (y+i)] == turn) { win++; } else { toDownLeft = false; }
                if(toUpRight && (x+i) <= maxX && (y-i) <= maxY && this.board[(x+i) + 'x' + (y-i)] == turn) { win++; } else { toUpRight = false; }
            }
            break;

        default: return false; break;
    }
    return(win >= this.stepsToWin);
}