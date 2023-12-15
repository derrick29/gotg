const assetMap = {
    "5*G": "/assets/GotG-001",
    "4*G": "/assets/GotG-002",
    "3*G": "/assets/GotG-003",
    "2*G": "/assets/GotG-004",
    "1*G": "/assets/GotG-005",
    "COL": "/assets/GotG-006",
    "LTC": "/assets/GotG-007",
    "MAJ": "/assets/GotG-008",
    "CPT": "/assets/GotG-009",
    "1LT": "/assets/GotG-010",
    "2LT": "/assets/GotG-011",
    "SGT": "/assets/GotG-012",
    "PVT": "/assets/GotG-014",
    "SPY": "/assets/GotG-spy",
    "FLG": "/assets/GotG-flag"
}

const username = localStorage.getItem('username');
let rooom = localStorage.getItem('room');

if(!username) {
    window.location.href = '/login'
}

const socket = io();

socket.emit('checkLogin', username);

socket.on('loginChecked', data => {
    if(!data) {
        localStorage.clear();
        window.location.href = '/';
    }
})

if(rooom) {
    socket.emit('GET_MAP', {
        room: rooom,
        general: username
    })
}

document.getElementById('wc').innerHTML = "General: " + username

const logout = document.getElementById('logout');
const btnCreate = document.getElementById('btnCreate');
const btnChallenge = document.getElementById('btnJoin');

let gameStarted = false;

logout.addEventListener('click', e => {
    socket.emit('logout', {
        general: localStorage.getItem('username'),
        room: localStorage.getItem('room')
    });
    localStorage.clear();
    window.location.href = '/login';
})

btnCreate.addEventListener('click', () => {
    const username = localStorage.getItem('username');

    if(localStorage.getItem('room')) {
        alert("ALREADY IN A ROOM");
        return;
    }

    socket.emit('CREATE_ROOM', username);
});

btnChallenge.addEventListener('click', e => {
    
    const username = localStorage.getItem('username');
    if(localStorage.getItem('room')) {
        alert("ALREADY IN A ROOM");
        return;
    }

    const roomName = prompt("Enter Room: ");

    localStorage.setItem('room', roomName)
    socket.emit('JOIN_ROOM', {
        general: username,
        room: roomName
    })
});

socket.on('ROOM_EXISTS', data => {
    localStorage.removeItem('room');
    alert('Room already created');
});

socket.on('ROOM_CREATED', data => {
    localStorage.setItem('room', data.room)
    renderBoard(data.map);

    // document.getElementById('txtRoom').innerHTML = `Room: ${data.room} ---- Status: ${data.gameStarted ? 'Playing' : 'Preparation'}`
});

socket.on('JOIN_FAILED', data => {
    localStorage.removeItem('room');
    if(data['notFound']) {
        alert("ROOM DOES NOT EXIST")
    }

    if(data['hasOpponent']) {
        alert("ROOM ALREADY FULL")
    }
})

socket.on("BATTLE_START", data => {
    const room = localStorage.getItem('room');
    const username = localStorage.getItem('username');

    socket.emit('GET_MAP', {room, general: username})
});

socket.on('MAP_UPDATED', data => {
    console.log("MAP_UPDATE", data)

    if(data.room === localStorage.getItem('room')) {
        if(data.gameStarted) {
            const isPlayer1 = data.room === username;

            if((isPlayer1 && data.isPlayer1Turn) || (!isPlayer1 && !data.isPlayer1Turn)) {
                document.getElementById('txtRoom').innerHTML = 'Your turn'
            }

            if((!isPlayer1 && data.isPlayer1Turn) || (isPlayer1 && !data.isPlayer1Turn)) {
                document.getElementById('txtRoom').innerHTML = `Opponents turn`
            }
            
        }
        renderBoard(data.map, data.gameStarted);
    }
})

socket.on("JOIN_SUCCESS", data => {
    console.log("JOIN_SUCCES", data)
    // document.getElementById('txtRoom').innerHTML = `Room: ${data.room} ---- Status: ${data.gameStarted ? 'Playing' : 'Preparation'}`
});

socket.on("GAME_STARTED", data => {
    if(data.room === localStorage.getItem('room')) {
        // document.getElementById('txtRoom').innerHTML = `Room: ${data.room} ---- Status: ${data.gameStarted ? 'Playing' : 'Preparation'}`;

        document.getElementById("ct").innerHTML = ''
    }
})

socket.on("CT", data => {
    if(data.room === localStorage.getItem('room')) {
        if(data.secs > 0) {
            document.getElementById("ct").innerHTML = `Setup Phase: ${data.secs}`;
        } else {
            document.getElementById("ct").innerHTML = '';
        }
    }
});

socket.on("ROOM_DELETED", data => {
    const room = localStorage.getItem('room');

    if(room === data) {
        localStorage.removeItem('room');
        alert("ROOM ENDED");
        window.location.href = '/';
    }
})

socket.on("GAME_OVER", data => {
    renderBoard(data.map, true, true);
    // await new Promise((res) => {
    //     setTimeout(res, 2000);
    // })

    setTimeout(() => {
        alert(`Game Over! \n Winner: ${data.winner}`);
        localStorage.removeItem('room');
        window.location.href = '/';
    }, 1000)
    
})

function renderBoard(data, gameStarted, gameOver = false) {
    const username = localStorage.getItem('username');

    document.getElementById('board').innerHTML = '';

    for(let i = 0; i < data.length; i++) {
        const row = data[i];

        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        for(let j = 0; j < row.length; j++) {
            const cell = row[j];

            if(cell !== null) {
                const cellOwned = cell.general === username;
                const cellDiv = document.createElement('div');
                cellDiv.className = 'piece';
                // cellDiv.innerHTML = !cellOwned ? gameOver ? cell.key : 'XXX' : cell.key;

                cellDiv.id = `piece-${i},${j}`;
                
                const imgDiv = document.createElement('img');
                imgDiv.src = !cellOwned ? gameOver ? assetMap[cell.key] + "B.svg" : "/assets/enemy.svg" : assetMap[cell.key] + "W.svg";
                imgDiv.className = "piece-img";

                cellDiv.appendChild(imgDiv)

                if(cellOwned) {
                    cellDiv.addEventListener('click', () => {

                        socket.emit('PIECE_CLICKED', {
                            room: localStorage.getItem('room'),
                            general: username,
                            piece: cell
                        })

                    });
                }

                rowDiv.appendChild(cellDiv);
            } else {
                const cellDiv = document.createElement('div');
                cellDiv.className = 'piece';
                cellDiv.id = `piece-${i},${j}`;
                rowDiv.appendChild(cellDiv);
            }
            
        }
        
        document.getElementById('board').appendChild(rowDiv);
    }

    for(const row of data) {
        for(const cell of row) {
            if(cell !== null) {
                const cellOwned = cell.general === username;

                if(cellOwned && cell.selected) {
                    // console.log(cell)
                    document.querySelectorAll('.piece').forEach(pc => pc.classList.remove('glow'))
            
                    const position = cell.position.replace(/ /g, '').split(",");
                    const y = +position[0];
                    const x = +position[1];
            
                    let canMove = false;
                    
                    if(y > 0) {
                        const isUpOccupied = data[y-1][x] !== null && (gameStarted && data[y-1][x].general === username);
            
                        if(!isUpOccupied) {
                            glowElement(y-1, x, cell);
                            canMove = true;
                        }
                    }
            
                    if(y < 7) {
                        const isDownOccupied = data[y+1][x] !== null && (gameStarted && data[y+1][x].general === username);
            
                        if(!isDownOccupied) {
                            glowElement(y+1, x, cell);
                            canMove = true;
                        }
                        
                    }
            
                    if(x > 0) {
                        const isLeftOccupied = data[y][x-1] !== null && (gameStarted && data[y][x-1].general === username);
                        if(!isLeftOccupied){
                            glowElement(y, x-1, cell);
                            canMove = true;
                        }
                    }
            
                    if(x < 8) {
                        const isRightOccupied = data[y][x+1] !== null && (gameStarted && data[y][x+1].general === username);
                        if(!isRightOccupied) {
                            glowElement(y, x+1, cell);
                            canMove = true;
                        }
                    }
                }
            }
        }
    }
}

function glowElement(y, x, piece) {
    const element = document.getElementById(`piece-${y},${x}`);
    element.classList[`${piece.selected ? 'add' : 'remove'}`]('glow');

    element.addEventListener('click', () => {
        socket.emit('PIECE_MOVE', {
            room: localStorage.getItem('room'),
            general: username,
            piece,
            y, x
        })
    });
}

// const game = new Game();

