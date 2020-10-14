var c = document.getElementById("c");
var ctx = c.getContext("2d");
colors = ["rgb(255, 100, 100)", "rgb(100, 255, 100)", "rgb(100, 100, 255)"]
shapes = [["XXXX", "OOOO", "OOOO", "OOOO"],
          ["XXOO", "XOOO", "XOOO", "OOOO"],
          ["XXOO", "XXOO", "OOOO", "OOOO"],
          ["XOOO", "XXOO", "XOOO", "OOOO"],
          ["XOOO", "XXOO", "OXOO", "OOOO"]]

class Block {
  constructor() {
    this.shape = shapes[randomInt(0, shapes.length)]
    this.color = colors[randomInt(0, colors.length)]
    this.subblocks = []
    this.grounded = false
    this.create()
  }

  create() {
    for (var i = 0; i < this.shape.length; i++) {
      for (var j = 0; j < this.shape.length; j++) {
        if (this.shape[i][j] == "X") {
          let sub = new SubBlock([j, i], this.color, this)
          this.subblocks.push(sub)  //How to use this "(pos=[j, i], color=this.color, parent = this)" ??
          grid[i][j] = sub
        }
      }
    }

    // Brute-forcing a valid position
    let tried_values = []
    this.pos = [randomInt(0, columns), 0]
    while (!this.validPos()) {
      tried_values.push(this.pos[0])
      if (tried_values.length == columns) {
        // There is no space left to spawn, restart game
        location.reload()
        return
      }
      this.pos = [randomInt(0, columns), 0]

    }
  }

  validPos() {
    for (let sub in this.subblocks) {

      let out_right = eval(this.subblocks[sub].abs_pos(0) >= columns)
      let out_left = eval(this.subblocks[sub].abs_pos(0) < 0)
      let out_bottom = eval(this.subblocks[sub].abs_pos(1) >=  c.height / size)
      if (out_left || out_right || out_bottom) {
        // a subblock is out of bounds. The pos is invalid.
        return false
      }

      for (let obj in objects) {
        if (objects[obj] == this) {continue}
        for (let other_sub in objects[obj].subblocks) {
          let same_x = eval(this.subblocks[sub].abs_pos(0) == objects[obj].subblocks[other_sub].abs_pos(0))
          let same_y = eval(this.subblocks[sub].abs_pos(1) == objects[obj].subblocks[other_sub].abs_pos(1))
          if (same_x && same_y) {
            // a subblock is sharing the grid with a different subblock
            // The pos is invalid.
            return false
          }
        }
      }
    }
    return true
  }

  rotate () {

  }

  update () {
    if (this.subblocks.length == 0) {
      objects.slice(objects.indexOf(this), 1)
      return
    }

      this.pos[1] += 1
      this.grounded = false
      this.collision()
  }

  collision () {
    if (!this.validPos()) {
      this.pos[1] -= 1
      this.grounded = true
      }
    }

  almostGrounded() {
      // Block just touched ground, so last call
      // to ValidPos was true and therefore grounded is still false
      // TL;DR One update before grounded
      this.pos[1] += 1
      if (!this.validPos()) {
        this.pos[1] -= 1
        return true
        }
      this.pos[1] -= 1
      return false

    }
  }

class SubBlock {
  constructor(pos, color, parent) {
    this.pos = pos
    this.color = color
    this.parent = parent
  }

  abs_pos(i) {
    return this.parent.pos[i] + this.pos[i]
  }
}


// Game Variables
var pos =  [c.width/2, c.height/2]
var last_time = 0
const border_line = 2
const sec_per_grid = 500 // milliseconds of delay per grid drop
const columns = 10
const rows = 20
const size = c.width / columns  // Size of the grid
var active = 0 // The active collection of objects
var falling_subblocks = [] //Subblocks that should fall down next cycle
var keys = {40: false}

// Set up grid
var grid = []
for (let y = 0; y < rows, y++) {
  grid.push([])
  for (let x = 0; x < columns, x++) {
    grid.push(0)
  }
}

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
setInterval(game, 1000/60)

function keyDown(evt) {

  switch (evt.keyCode) {
    case 37:  // Left Arrow
      objects[objects.length - 1].pos[0] -= 1
      if (!objects[objects.length - 1].validPos()) {
        objects[objects.length - 1].pos[0] += 1
      }
      break;

    case 38:  // Up Arrow
      objects[objects.length - 1].rotate()
      break;

    case 39:  // Right Arrow
      objects[objects.length - 1].pos[0] += 1
      if (!objects[objects.length - 1].validPos()) {
        objects[objects.length - 1].pos[0] -= 1
      }
      break;

    case 40:  // Down Arrow
      keys[evt.keyCode] = true
      break;

    case 32:  // Space
      while (objects[objects.length - 1].validPos()) {
        objects[objects.length - 1].pos[1] += 1
      }
      objects[objects.length - 1].pos[1] -= 1
      last_time = 0
      break;
  }

}

function keyUp(evt) {
  switch (evt.keyCode) {
    case 40:  // Down Arrow
      keys[evt.keyCode] = false
      break;
    }
}

function customKeys() {
  for (var key in keys) {
    if (keys[key]) {
      if (key == 40) {
        for (let obj in objects) {
          if (!objects[obj].almostGrounded()) {
            // There exists a block that is not grounded,
            // The player is allowed to speed up with the Down Arrow
            last_time = 0
          }
        }
      }
    }
  }
}


// Clamping value between min and max
function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max))
}

// Random_Int function (inclusive, exclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min
}


function game() {
  if (new Date().getTime() >= last_time + sec_per_grid) {
      last_time = new Date().getTime()

  }

  ctx.fillStyle="black";
  ctx.fillRect(0, 0, c.width, c.height)

  customKeys()

  for (let y = 0; y < rows, y++) {
    for (let x = 0; x < columns, x++) {
      if (grid[y][x] != 0) {
        draw(grid[y][x])
      }
    }
  }

  // Grid lines
  ctx.fillStyle="rgba(100, 100, 100, 0.4)";
  for (var i = 1; i < columns; i++) {
      ctx.fillRect(i * size, 0, 1, c.height)
  }

  for (var i = 1; i < rows; i++) {
      ctx.fillRect(0, i * size, c.width, 1)
  }
}

function draw(obj) {

  ctx.fillStyle=obj.color
  ctx.fillRect(obj.abs_pos(0)*size, obj.abs_pos(1)*size, size, size)

  ctx.fillStyle="black"
  ctx.fillRect(obj.abs_pos(0)*size, obj.abs_pos(1)*size, border_line, size)
  ctx.fillRect(obj.abs_pos(0)*size, obj.abs_pos(1)*size, size, border_line)
  ctx.fillRect(obj.abs_pos(0)*size + size - border_line, obj.abs_pos(1)*size, border_line, size)
  ctx.fillRect(obj.abs_pos(0)*size, obj.abs_pos(1)*size + size - border_line, size, border_line)
}


function line_test() {
  for (let obj in objects) {
    if (!objects[obj].grounded) {
      console.log(objects[obj].validPos(true))
      return true
    }
  }
  let grid = []
  let has_removed = false
  for (var y = 0; y < rows; y++) {
    grid.push([])
    for (var x = 0; x < columns; x++) {
      grid[y].push([])
      for (let obj in objects) {
        for (let sub in objects[obj].subblocks) {
          let same_x = eval(objects[obj].subblocks[sub].abs_pos(0) == x)
          let same_y = eval(objects[obj].subblocks[sub].abs_pos(1) == y)
          if (same_x && same_y) {
            grid[y][x] = [objects[obj].subblocks, objects[obj].subblocks[sub]]
          }
        }
      }
    }
  }

  // Deleting afterwards, in order to not mess up indexing in the for-loop
  // EDIT: Turns out it DOESN'T! The number of times a "for ... in"-loop runs
  // is determined in advance. It will still run 10 times, if that was the
  // size of the list when the loop first got initiated even if the size
  // of the list is changed inside the loop at runtime.
  // NOT GOING TO CHANGE IT BACK BECAUSE LEAVING
  // THIS MESSAGE HERE TO MAKE SURE I KNOW IT PROPERLY
  // COULD PROVE USEFUL LATER

  for (var y = 0; y < rows; y++) {

    let every = true
    for (let i = 0; i < grid[y].length; i++) {
      if (grid[y][i].length == 0) {
        every = false
      }
    }

    if (every) {
        has_removed = true
        for (let x in grid[y]) {
          let index = grid[y][x][0].indexOf(grid[y][x][1])
          grid[y][x][0].splice(index, 1)
        }
        // Make all blocks above this line fall down one grid
        for (let obj in objects) {
          for (let sub in objects[obj].subblocks) {
            let name = objects[obj].subblocks[sub]
            if (name.abs_pos(1) == (rows-1) - y) {
              falling_subblocks.push(name)
            }
          }
        }
      }
    }

  return has_removed
}
