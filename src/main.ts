import { Rect, drawRect, randInt } from "./lib";
import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <canvas id="canvas" width=500 height=500/>
`;

class SnakePart {
    public constructor(public x: number, public y: number) {}

    draw(c: string) {
        drawRect(
            ctx,
            {
                x: this.x * 50,
                y: this.y * 50,
                s: 50,
            },
            c
        );
    }
}
let food: SnakePart = new SnakePart(randInt(10), randInt(10));
let keys: any = {};
class Snake {
    score = 0;
    rects: SnakePart[] = [new SnakePart(randInt(10), randInt(10))];
    dir: "l" | "u" | "d" | "r" = "l";

    draw() {
        this.rects.forEach((r, i) => r.draw(i == 0 ? "#0f0" : "#0a0"));
    }
    processInput() {
        console.log(keys);
        if ((keys["a"] || keys["ArrowLeft"]) && this.dir != "r") {
            this.dir = "l";
        }
        if ((keys["d"] || keys["ArrowRight"]) && this.dir != "l") {
          this.dir = "r";
        }
        if ((keys["w"] || keys["ArrowUp"]) && this.dir != "d") {
          this.dir = "u";
        }
        if ((keys["s"] || keys["ArrowDown"]) && this.dir != "u") {
          this.dir = "d";
        }
        keys = {};
    }
    move() {
        // this.rects.forEach((r) => r.draw());
        const head = new SnakePart(this.rects[0].x, this.rects[0].y);
        if (this.dir == "l") {
            head.x--;
        }
        if (this.dir == "r") {
            head.x++;
        }
        if (this.dir == "u") {
            head.y--;
        }
        if (this.dir == "d") {
            head.y++;
        }

        if (head.x < 0) head.x = 9;
        if (head.x > 9) head.x = 0;
        if (head.y < 0) head.y = 9;
        if (head.y > 9) head.y = 0;

        if (
            this.rects.find((r) => {
                return head.x == r.x && head.y == r.y;
            })
        ) {
            alert("scarso");
            location.reload();
            this.rects.splice(1);
        }

        this.rects.unshift(head);

        let eat = false;
        while (head.x == food.x && head.y == food.y) {
            eat = true;
            while (this.rects.some((r) => r.x == food.x && r.y == food.y)) {
                food = new SnakePart(randInt(10), randInt(10));
            }
        }

        if (!eat) this.rects.pop();
        else this.score++;
    }
}

const canvas: HTMLCanvasElement = document.querySelector("#canvas")!;

const ctx = canvas.getContext("2d")!;
const map: Rect = {
    x: 0,
    y: 0,
    s: 500,
};
const snake = new Snake();
setInterval(() => {
    drawRect(ctx, map, "#222");
    ctx.fillStyle = "#0f0"
    ctx.font = "40px monospace";
    ctx.fillText(snake.score.toString(), 10, 490);
    drawRect(
        ctx,
        {
            x: food.x * 50,
            y: food.y * 50,
            s: 50,
        },
        "#0ff"
    );
    snake.processInput();
    snake.move();
    snake.draw();
    console.log(snake);
}, 100);

window.addEventListener("keydown", function (e) {
    keys = {};
    keys[e.key] = true;
});
window.addEventListener("keyup", function (e) {});
