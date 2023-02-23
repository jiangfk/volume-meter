function vumeter(elem) {
    const c = elem.getContext('2d');
    const w = elem.width;
    const h = elem.height;
    const barcount = 26;
    const bargap = 0.002 * h;
    const height = (elem.height - 0.01 * h) / barcount - bargap;
    c.fillStyle = 'green';
    c.strokeStyle = 'black';
    const getBoxColor = (i, val) => {
        let c = 99;
        if (i < barcount - 2/3 * barcount) {
            c= 48;
        }
        if (i < barcount - 5/6 * barcount) {
            c = 0;
        }
        let l = 20;
        if (i / barcount * (-60) <= val || (i - val < 2)) {
            l = 50;
        }
        return `hsl(${c}, 70%, ${l}%)`;
    }
    const drawText = () => {
        c.fillStyle = '#333';
        c.font = '150px';
        c.fillText(0, w - 20, height); // 头刻度
        c.fillText(-60, w - 20, height * barcount + bargap * (barcount - 2));   // 尾刻度
    }
    let currentVol = -60;
    function draw() {
        let targetVol = (-60) * (1 -  elem.dataset.volume * 1.8);
        
        if (targetVol > currentVol) {
            currentVol += (targetVol - currentVol) * 0.2;
        } else {
            currentVol -= (currentVol - targetVol) * 0.2;
        }
        c.clearRect(0, 0, w, h);
        drawText();
        for (let i = 0; i < barcount; i++) {
            c.beginPath();
            c.shadowColor = c.fillStyle = getBoxColor(i, currentVol);
            c.rect(w * 0.1, i * height + (bargap * (i + 1)), w - (2 * 0.1 * w) - 18, height);
            // c.stroke();
            c.fill();
        }
        requestAnimationFrame(draw)
    }

    draw()
}