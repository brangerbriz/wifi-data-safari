class TargetTracker {
    constructor(opts){

        //  -   -   -   -
        // create canvas "target" spinner
        //  -   -   -   -
        this.c = document.createElement('canvas')
        this.ctx = this.c.getContext('2d')
        this.inCircA = this.inCircB = 0
        this.outCircA = this.outCircB = Math.PI
        this.lineWidth = 4
        this.inRadius = 16
        this.outRadius = this.inRadius + this.lineWidth + 5
        this.c.width = this.outRadius*2 + this.lineWidth
        this.c.height = this.outRadius*2 + this.lineWidth

        if(!opts) opts = {}
        this.color = opts.color || "#000000"
        this._x = opts.x || 0
        this._y = opts.y || 0
        this._z = opts.z || 0

        this.updateTargetCSS()
        document.body.appendChild(this.c)
    }

    get x(){ return this._x }
    set x(x){
        this._x = x - this.c.width/2
        this.updateTargetCSS()
    }
    get y(){ return this._y }
    set y(y){
        this._y = y - this.c.height/2
        this.updateTargetCSS()
    }
    get z(){ return this._z }
    set z(z){ this._z = z; this.updateTargetCSS() }

    updateTargetCSS(){
        this.c.style.position = 'absolute'
        this.c.style.left = this.x+'px'
        this.c.style.top = this.y+'px'
        this.c.style.zIndex = this.z
    }

    clear(){
        this.ctx.clearRect(0,0,this.c.width,this.c.height)
    }

    draw(){
        //  -   -   -   -
        // spin target
        //  -   -   -   -
        let tx = this.c.width/2
        let ty = this.c.height/2
        this.clear()

        this.ctx.lineCap = "round"
        this.ctx.lineWidth = this.lineWidth

        this.inCircA += 0.1
        this.inCircB = this.inCircA+(Math.PI*1.5)
        this.ctx.beginPath()
        this.ctx.arc(tx, ty, this.inRadius, this.inCircA, this.inCircB, false)
        this.ctx.strokeStyle = this.color
        this.ctx.stroke()
        this.ctx.closePath()

        this.outCircA -= 0.1
        this.outCircB = this.outCircA+(Math.PI*1.5)
        this.ctx.beginPath()
        this.ctx.arc(tx, ty, this.outRadius, this.outCircA, this.outCircB, false)
        this.ctx.strokeStyle = this.color
        this.ctx.stroke()
        this.ctx.closePath()
    }

    animate(){
        requestAnimationFrame(()=>{
            this.draw()
        })
    }
}
