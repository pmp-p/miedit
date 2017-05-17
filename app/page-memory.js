/*
grid = { cols: …, rows: … }
char = { width: …, height: … }
zoom = { x: …, y: … }
*/
function PageMemory(grid, char, zoom, canvas) {
    "use strict";

    this.grid = grid;
    this.char = char;
    this.zoom = zoom;
    this.canvas = canvas;
    this.context = this.createContext();
    this.colors = this.minitelColors;

    this.font = {
        'G0': this.loadFont('font/ef9345-g0.png'),
        'G1': this.loadFont('font/ef9345-g1.png'),
    };

    this.cursor = {
        x: 0,
        y: 1,
        visible: false,
    };

    this.memory = [];

    for(let j = 0; j < this.grid.rows; j++) {
        let row = [];
        for(let i = 0; i < this.grid.cols; i++) {
            row[i] = new MosaicCell();
        }
        this.memory[j] = row;
    }
}

PageMemory.prototype.createContext = function() {
    "use strict";

    const ctx = this.canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.scale(this.zoom.x, this.zoom.y);
    ctx.fillStyle = "#000000";
    ctx.fillRect(
        0,
        0,
        this.char.width * this.grid.cols * this.zoom.x,
        this.char.height * this.grid.rows * this.zoom.y
    );
    
    return ctx;
};

PageMemory.prototype.loadFont = function(url) {
    "use strict";
    return new FontSprite(
        url,
        { cols: 8, rows: 16 },
        this.char,
        this.zoom,
        this.colors
    );
};

PageMemory.prototype.scroll = function(direction) {
    "use strict";

    const newRow = []
    for(let col = 0; col < this.grid.cols; col++) {
        newRow[col] = new MosaicCell();
    }

    switch(direction) {
        case 'up':
            for(let row = 2; row < this.grid.rows; row++) {
                this.memory[row] = this.memory[row + 1];
            }

            this.memory[this.grid.rows - 1] = newRow;

            break;
            
        case 'down':
            for(let row = this.grid.rows - 1; row > 1; row--) {
                this.memory[row] = this.memory[row - 1];
            }

            this.memory[1] = newRow;

            break;
    }
}

PageMemory.prototype.minitelGrays = [
    '#000000', // 0%
    '#7F7F7F', // 50%
    '#B2B2B2', // 70%
    '#E5E5E5', // 90%
    '#666666', // 40% 
    '#999999', // 60%
    '#CCCCCC', // 80%
    '#FFFFFF', // 100%
];

PageMemory.prototype.minitelColors = [
    '#000000', // black
    '#FF0000', // red
    '#00FF00', // green
    '#FFFF00', // yellow
    '#0000FF', // blue
    '#FF00FF', // magenta
    '#00FFFF', // cyan
    '#FFFFFF', // white
];

PageMemory.prototype.render = function() {
    "use strict";

    // Add the inverted F on the status line
    const fCell = new CharCell();
    fCell.value = 0x46;
    fCell.invert = true;
    this.memory[0][38] = fCell;

    const defaultFgColor = 7;
    const defaultBgColor = 0;
    const ctx = this.context;

    let page = 'G0';
    let part = { x: 0, y: 0};
    let mult = { width: 1, height: 1};
    let unde = false;

    // Draw each cell
    for(let row = 0; row < this.grid.rows; row++) {
        // Zone attributes
        let bgColor = defaultBgColor;
        let mask = false;
        let underline = false;

        const y = row * this.char.height;

        for(let col = 0; col < this.grid.cols; col++) {
            const cell = this.memory[row][col];
            const x = col * this.char.width;

            if(cell.type !== 'C') bgColor = cell.bgColor;
            if(cell.type === 'M') underline = false;

            let front = cell.invert ? bgColor : cell.fgColor;
            let back = cell.invert ? cell.fgColor : bgColor;

            // Draw background
            ctx.fillStyle = this.colors[back];
            ctx.fillRect(
                x, y,
                this.char.width, this.char.height
            );

            // Draw character
            if(!mask) {
                if(cell.type !== 'M') {
                    page = this.font['G0'];
                    part = cell.part;
                    mult = cell.mult;
                    unde = underline;
                } else {
                    page = this.font['G1'];
                    part = { x: 0, y: 0 };
                    mult = { width: 1, height: 1 };
                    unde = false;
                }

                page.writeChar(ctx, cell.value, x, y, part, mult, front, unde);
            }

            if(cell.type === 'D') {
                if(cell.mask !== undefined) mask = cell.mask;
                if(cell.zoneUnderline !== undefined) underline = cell.zoneUnderline;
            }
        }
    }
}

