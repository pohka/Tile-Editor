
class MapViewport extends Viewport
{
  constructor(id)
  {
    super(id);
    this.isPainting = false;
    this.addInput();
  }

  addInput()
  {
    let vp = this;
    vp.canvas.addEventListener("mousedown",function(e){
      //left mouse button
      if(e.button == 0){
        vp.isPainting = true;
        if(States.current.tool == "brush"){
          Tools.setTileAtCursor(e, vp, States.current.tileID);
        }
        else if(States.current.tool == "eraser"){
          Tools.setTileAtCursor(e, vp, -1);
        }

        vp.draw();
      }
    });

    document.addEventListener("mousemove", function(e){
      vp.lastCursorPos.set(e.clientX, e.clientY);
      let isOverViewport = vp.isCursorOverViewport(e.clientX, e.clientY);

      if(vp.isPainting && isOverViewport){
        if(States.current.tool == "brush"){
          Tools.setTileAtCursor(e, vp, States.current.tileID);
        }
        else if(States.current.tool == "eraser"){
          Tools.setTileAtCursor(e, vp, -1);
        }
      }
    });

    document.addEventListener("mouseup",function(e){
      if(e.button == 0){
        vp.isPainting = false;
      }
    });
  }

  //converts world coordinates to chunk coordinates
  worldCoorToChunkCoor(worldX, worldY)
  {
    return new Vector(
      Math.floor(worldX/MapData.chunk_total_size),
      Math.ceil(worldY/MapData.chunk_total_size)
    );
  }

  draw()
  {
    super.clear();
    this.drawChunks();
    if(States.isCollisionVisible)
    {
      this.drawCollision();
    }
    if(States.isRulersVisible)
    {
      this.ruler.draw(this);
      this.drawChunkPositions();
    }
    this.drawHUD();
  }

  //draws all the chunks
  drawChunks()
  {
    let camFocus = this.getWorldFocus();
    let visibleChunkIndexes = [];

    for(let i=0; i<MapData.chunks.length; i++)
    {
      if(this.isChunkInViewPort(MapData.chunks[i]))
      {
         visibleChunkIndexes.push(i);
      }
    }

    for(let a=0; a<MapData.draw_layers.length; a++)
    {
      let layerID = a;

      for(let b=0; b<visibleChunkIndexes.length; b++)
      {
        let index = visibleChunkIndexes[b];
        let chunk = MapData.chunks[index];
        let layer = MapQuery.getChunkLayerByID(chunk, layerID);
        if(layer != null)
        {
          this.drawLayer(mapViewport, layer, chunk.x, chunk.y);
        }
      }
    }
  }

  drawLayer(vp, layer, chunkX, chunkY)
  {
    let camFocus = this.getWorldFocus();
    let chunkOffset = new Vector(
      chunkX * MapData.chunk_size,
      chunkY * MapData.chunk_size
    );

    for(let i=0; i<layer.map.length; i++)
    {
      for(let j=0; j<layer.map[i].length; j++)
      {
        let tileID = layer.map[i][j];
        if(tileID > -1)
        {
          let tile = MapQuery.findTileByID(tileID);
          if(tile != null)
          {
            let texture = MapQuery.findTextureByName(tile.tex_name);
            if(texture != null)
            {
              let img = States.findImgObj(texture.name);
              if(img != null)
              {
                let srcX = tile.tex_x * MapData.tile_size;
                let srcY = tile.tex_y * MapData.tile_size;
                let destX = camFocus.x + (j*MapData.tile_size) + chunkOffset.x;
                let destY = camFocus.y + i*MapData.tile_size + chunkOffset.y;

                vp.ctx.drawImage(img,
                  srcX, srcY, MapData.tile_size, MapData.tile_size,
                  destX, destY, MapData.tile_size, MapData.tile_size
                );
              }
              else {
                console.log("image not found for texture", texture.name);
              }
            }
            else {
              console.log("texture name not found", tile.tex_name);
            }
          }
          else{
            console.log("tile not found:", tileID);
          }
        }
      }
    }
  }

  //draw collision
  drawCollision()
  {
    //tile collision
    let camFocus = this.getWorldFocus();
    for(let i=0; i<MapData.chunks.length; i++)
    {
      if(this.isChunkInViewPort(MapData.chunks[i]))
      {
        //MapData.chunks[i].drawCollision(this, camFocus);
      }
    }
  }

  //returns true if a chunk is within the viewport
  isChunkInViewPort(chunk)
  {
    return this.isRectInViewPort(
      chunk.x * MapData.chunk_total_size,
      chunk.y * MapData.chunk_total_size,
      MapData.chunk_total_size, MapData.chunk_total_size
    );
  }

  //draws the chunk position text
  drawChunkPositions()
  {
    let camFocus = this.getWorldFocus();
    this.ctx.font = "50px Verdana";
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = "#dfdfdf33";

    for(let i=0; i<MapData.chunks.length; i++){

      let x = MapData.chunks[i].x * MapData.chunk_total_size;
      let y = MapData.chunks[i].y * MapData.chunk_total_size;

      let isInVP = this.isRectInViewPort(
        x, -y, MapData.chunk_total_size, MapData.chunk_total_size
      );

      if(isInVP)
      {
        let str = "(" + MapData.chunks[i].x + "," + (MapData.chunks[i].y) + ")";
        this.ctx.fillText(
          str,
          camFocus.x + x + MapData.chunk_total_size/2,
          camFocus.y + y + MapData.chunk_total_size/2
        );
      }
    }
  }

  drawHUD()
  {
    //cursor tile highlighter
    let tileWorldPos = Tools.getTileWorldPosAtCursor(this, this.lastCursorPos.x, this.lastCursorPos.y);
    if(tileWorldPos != null)
    {
      let camFocus = this.getWorldFocus();
      let x = tileWorldPos.x + camFocus.x;
      let y = -tileWorldPos.y + camFocus.y;
      this.ctx.fillStyle = "#ccc6";
      this.ctx.strokeStyle="#fff";

      this.ctx.fillRect(x, y, MapData.tile_size, MapData.tile_size);
      this.ctx.beginPath();;
      this.ctx.rect(x,y, MapData.tile_size, MapData.tile_size);
      this.ctx.stroke();
    }
    else {
      //console.log("no tile found in at cursors position");
    }
  }
}