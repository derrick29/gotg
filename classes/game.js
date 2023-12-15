const {DEFAULTS, PIECE_DICT} = require('../utils/constants');

class General {
    constructor(general, isPlayer1) {
        this.general = general;
        this.pieces = [];
        this.self = this;

        this.defaultPieces = isPlayer1 ? DEFAULTS.player1 : DEFAULTS.player2;

        this.initPieces();
    }

    initPieces() {
        for(let i = 0; i < this.defaultPieces.length; i++) {
            for(let j = 0; j < this.defaultPieces[i].length; j++) {
                const cell = this.defaultPieces[i][j];
                if(cell !== null) {
                    const piece = new Piece(cell, PIECE_DICT[cell].title, `${i},${j}`, this.general);
                    this.pieces.push(piece);
                }
            }
        }
    }
}

class Piece {
    constructor(key, title, position, general) {
        this.key = key;
        this.title = title;
        this.position = position;
        this.general = general;

        this.selected = false;
    }
}

class Game {
    map = [
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null]
    ];

    constructor(socket, general) {
        this.socket = socket;
        this.general = general;
        this.hasOpponent = false;
        this.gameOver = false;
        this.winner = '';
        this.gameStarted = false;
        this.isPlayer1Turn = true;

        this.player1FlagSafe = false;
        this.player2FlagSafe = false;
        this.opponentGeneral = '';

        this.initBoard();
    }

    initBoard() {
        this.player1 = new General(this.general, true);
        this.pieces = [...this.player1.pieces];

        for(const piece of this.pieces) {
            this.populateMap(piece);
        }
    }

    join(general, socket, io) {
        if(this.hasOpponent) {
            socket.emit('JOIN_FAILED', {hasOpponent: true, general: this.general});
        } else {
            this.player2 = new General(general, false);
            this.pieces = [...this.pieces, ...this.player2.pieces];

            for(const piece of this.pieces) {
                this.populateMap(piece);
            }

            socket.emit('JOIN_SUCCESS', {
                room: this.general,
                player1: this.general,
                player2: general,
                gameStarted: this.gameStarted
            })
        }

        this.startCountdown(io);
    }

    startCountdown(io) {
        let secs = 0;
        let interval = setInterval(() => {
            if(secs === 10) {
                clearInterval(interval);
                this.gameStarted = true;
                io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});

                io.emit("GAME_STARTED", {room: this.general, gameStarted: true})
            }

            io.emit("CT", {secs: 10 - secs, room: this.general})
            secs++;
        }, 1000);
    }

    populateMap(piece) {
        const position = piece.position.replace(/ /g, '').split(",");
        const y = position[0];
        const x = position[1];

        this.map[y][x] = piece;
    }

    displayMapForPlayer(general) {
        const tmpMap = JSON.parse(JSON.stringify(this.map));
        for(const row of tmpMap) {
            for(const piece of row) {
                if(piece !== null && piece.general !== general) {
                    row.key = "XXX";
                    row.title = "XXX";
                }
            }
        }

        return tmpMap;
    }

    pieceClicked(socket, io, general, piece) {
        if(this.gameStarted) {
            const isPlayer1 = this.general === general;

            if((this.isPlayer1Turn && isPlayer1) || (!this.isPlayer1Turn && !isPlayer1)) {
                this.unSelectAll(general);

                const position = this.parsePosition(piece.position);
    
                this.map[position.y][position.x].selected = piece.selected ? false : true;
        
                io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});
            }

        } else {
            let hasSelected = false;
            let selectedPiece = null;

            for(const row of this.map) {
                for(const piece of row) {
                    if(piece !== null && piece.selected) {
                        hasSelected = true;
                        selectedPiece = piece;
                    }
                }
            }
    
            const position = this.parsePosition(piece.position);
            this.map[position.y][position.x].selected = piece.selected ? false : true;        
            
            // if(piece.location === selectedPiece.location) {
            //     this.unSelectAll(piece.general);
            // }

            io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});

        }
        
    }

    movePiece(io, data) {
        if(this.gameStarted) {
            this.unSelectAll(data.piece.general);
            const newPositionPiece = this.map[data.y][data.x];
    
            const oldPosition = this.parsePosition(data.piece.position);
            const piece = this.map[oldPosition.y][oldPosition.x];
    
            if(newPositionPiece === null) {
                this.map[data.y][data.x] = piece;
                this.map[data.y][data.x].position = `${data.y},${data.x}`;
    
                this.map[oldPosition.y][oldPosition.x] = null;

                this.checkFlagPos(data.piece);

                const moveInfo = {
                    pieceDead: false,
                    enemyDead: false,
                    gameOver: false,
                    winner: ''
                }

                
                if(data.piece.general === this.general && this.player2FlagSafe) {
                    moveInfo.gameOver = true;
                    moveInfo.winner = this.player2.general;
                }

                if(data.piece.general !== this.general && this.player1FlagSafe) {
                    moveInfo.gameOver = true;
                    moveInfo.winner = this.general;
                }

                if(moveInfo.gameOver) {
                    this.gameOver = true;
                    this.winner = moveInfo.winner;
                    io.emit('GAME_OVER', {...moveInfo, map: this.map});
                }

            } else {
                if(newPositionPiece.general !== data.piece.general) {
                    const moveInfo = this.checkMove(data.piece, newPositionPiece);
    
                    if(moveInfo.pieceDead && moveInfo.enemyDead) {
    
                        this.map[oldPosition.y][oldPosition.x] = null;
                        this.map[data.y][data.x] = null;
    
                    } else {
                        if(moveInfo.pieceDead) {
                            this.map[oldPosition.y][oldPosition.x] = null;
                        }
        
                        if(moveInfo.enemyDead) {
                            this.map[data.y][data.x] = piece;
                            this.map[data.y][data.x].position = `${data.y},${data.x}`;
                            this.map[oldPosition.y][oldPosition.x] = null;
                        }
                    }

    
                    if(moveInfo.gameOver) {
                        this.gameOver = true;
                        this.winner = moveInfo.winner;
                        io.emit('GAME_OVER', {...moveInfo, map: this.map});
                    }
                    
                }
            }

            this.isPlayer1Turn = this.isPlayer1Turn ? false : true;
    
            if(!this.gameOver) {
                io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});
            }
        } else {
            this.unSelectAll(data.piece.general);
            const isPlayer1 = data.piece.general === this.player1.general;

            if((isPlayer1 && data.y < 5) || (!isPlayer1 && data.y > 2)) {
                io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});
                return;
            }

            const newPositionPiece = this.map[data.y][data.x];
    
            const oldPosition = this.parsePosition(data.piece.position);
            const piece = this.map[oldPosition.y][oldPosition.x];

            piece.position = `${data.y},${data.x}`;
            
            if(newPositionPiece !== null) {
                newPositionPiece.position = `${oldPosition.y},${oldPosition.x}`
            }

            this.map[data.y][data.x] = piece;
            this.map[oldPosition.y][oldPosition.x] = newPositionPiece;

            io.emit('MAP_UPDATED', {map: this.map, gameStarted: this.gameStarted, room: this.general, isPlayer1Turn: this.isPlayer1Turn});

        }
        
    }

    checkMove(piece, enemyPiece) {
        const pieceCounter = PIECE_DICT[piece.key].eliminates.includes(enemyPiece.key);

        const matchResult = {
            pieceDead: !pieceCounter,
            enemyDead: pieceCounter,
            gameOver: false,
            winner: ''
        }

        if(piece.key === enemyPiece.key) {
            if(piece.key === "FLG") {
                matchResult.pieceDead = false;
                matchResult.enemyDead = true;

                matchResult.gameOver = true;
                matchResult.winner = piece.general;

            } else {
                matchResult.pieceDead = true;
                matchResult.enemyDead = true;

                matchResult.gameOver = true;
                matchResult.winner = 'Draw';
            }

            return matchResult;
        }

        if(enemyPiece.key === "FLG") {
            matchResult.pieceDead = false;
            matchResult.enemyDead = true;

            matchResult.gameOver = true;
            matchResult.winner = piece.general;
        }

        if(piece.key === "SPY") {
            if(enemyPiece.key === "PVT") {
                matchResult.pieceDead = true;
                matchResult.enemyDead = false;
            } else {
                matchResult.pieceDead = false;
                matchResult.enemyDead = true;
            }

            return matchResult;
        }

        if(piece.key === "FLG" && enemyPiece.key !== "FLG") {
            matchResult.pieceDead = true;
            matchResult.enemyDead = false;

            matchResult.gameOver = true;
            matchResult.winner = enemyPiece.general;
        }

        // const flagSafe = this.checkFlagPos(piece, enemyPiece);

        // if(flagSafe) {
        //     matchResult.gameOver = true;
        //     winner = piece.general;
        // }

        return matchResult;
    }

    checkFlagPos(p) {
        
        for(const row of this.map) {
            for(const piece of row) {
                if(piece !== null) {
                    const piecePosition = this.parsePosition(piece.position);
                    const isPlayer1 = piece.general === this.player1.general;
                    if((piece.key === "FLG" && piecePosition.y === 0 && isPlayer1) || (piece.key === "FLG" && piecePosition.y === 7 && !isPlayer1)) {
                        if(isPlayer1) {
                            this.player1FlagSafe = true;
                        } else {
                            this.player2FlagSafe = true;
    
                        }
                    }
                }
                
            }
        }
        // const position = this.parsePosition(piece.position);
        // const newPosition = this.parsePosition(newPositionPiece.position)

        // if(piece.key === "FLG") {

        //     const isLeftOccupied = newPosition.x > 0 ? this.map[newPosition.y][newPosition.x - 1] : false;

        //     const isRightOccupied = newPosition.x < 8 ? this.map[newPosition.y][newPosition.x + 1] : false;

        //     if(isPlayer1 && newPosition.y === 0) {
        
        //         const isDownOccupied = newPosition.y < 7 ? this.map[newPosition.y + 1][newPosition.x] !== null : false;

        //         return !isDownOccupied && !isLeftOccupied && !isRightOccupied;
        //     }

        //     if(!isPlayer1 && newPosition.y === 7) {
        //         const isUpOccupied = newPosition.y > 0 ? this.map[newPosition.y - 1][newPosition.x] !== null : false;

        //         return !isUpOccupied && !isLeftOccupied && !isRightOccupied;
        //     }
        // }
    }

    parsePosition(p) {
        const position = p.replace(/ /g, "").split(",");
        const y = +position[0];
        const x = +position[1];

        return {y, x}
    }

    unSelectAll(general) {
        for(const row of this.map) {
            for(const piece of row) {
                if(piece !== null && piece.general === general) {
                    piece.selected = false;
                }
            }
        }
    }

    startGame() {
    }
}

module.exports = {Game}