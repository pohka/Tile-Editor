//palette canvas
class PaletteViewport extends Viewport{
  constructor(id, width, height){
    super(id, width, height, new PaletteRuler(32), "#777");
    this.img = null;
    this.imgsrc = null;
    this.camera = new PaletteCamera(this);
  }

  //set the current image of the palette
  setImg(path){
    this.img = Store.findImgObj(path);
    this.imgsrc = path;
  }

  draw(){
    super.draw();
    if(this.img != null){
      this.ctx.drawImage(this.img, 0, 0);
    }

    this.ruler.draw(this);

    //draw collision for palette
    for(let i in Store.tiles){
      let tile = Store.tiles[i];
      if(tile.hasCollision && tile.src == this.imgsrc){
        this.ctx.beginPath();
        this.ctx.strokeStyle="#0F0";
        this.ctx.lineWidth="2";
        this.ctx.fillStyle="#0F05";
        this.ctx.fillRect(tile.x * Chunk.tileSize, tile.y * Chunk.tileSize, Chunk.tileSize, Chunk.tileSize);
        this.ctx.rect(tile.x * Chunk.tileSize, tile.y * Chunk.tileSize, Chunk.tileSize, Chunk.tileSize);

        this.ctx.stroke();
      }
    }

    //edit collision


  }
}
