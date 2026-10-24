"""Measure painted PNG silhouettes through the production renderer and CSS."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

MEASURE = r'''()=>[...document.querySelectorAll('.board .sq img.barida-approved-piece')].map(img=>{
              const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
              const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
              const d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
              let l=canvas.width,r=-1,t=canvas.height,b=-1;
              for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(d[(y*canvas.width+x)*4+3]>48){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
              const box=img.getBoundingClientRect(),sq=img.closest('.sq').getBoundingClientRect();
              const unit=Math.min(box.width/canvas.width,box.height/canvas.height);
              return {name:img.src.split('/').pop(),type:img.dataset.pieceType,
                height:(b-t+1)*unit/sq.height,width:(r-l+1)*unit/sq.width,
                cx:(box.x+box.width/2+((l+r+1)/2-canvas.width/2)*unit-(sq.x+sq.width/2))/sq.width,
                cy:(box.y+box.height/2+((t+b+1)/2-canvas.height/2)*unit-(sq.y+sq.height/2))/sq.height};
            })'''
ROOT = Path(__file__).resolve().parents[1]
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/shared-chess-board.js')
        page.set_content('''<link rel="stylesheet" href="/canonical-board.css">
          <style>.board{display:grid!important;grid-template-columns:repeat(6,var(--size))!important;width:max-content!important}
          .sq{width:var(--size)!important;height:var(--size)!important}
          .piece{width:100%!important;height:100%!important} img{transition:none!important}
          .sq:nth-child(odd){background:#c9aa7d}.sq:nth-child(even){background:#785236}</style>
          <div class="ca-grid"><div class="board"></div></div>
          <script src="/shared-chess-board.js"></script>''')
        for size in [40, 64, 96]:
            page.evaluate('''size=>{
              document.documentElement.style.setProperty('--size',size+'px');
              document.querySelector('.board').innerHTML=[...'KQRBNPkqrbnp'].map(piece=>
                '<div class="sq"><span class="piece ca-canonical-piece">'+
                window.ChessAcademySharedBoard.pieceSVG('',piece)+'</span></div>').join('');
            }''', size)
            page.wait_for_function('''()=>[...document.images].length===12&&[...document.images].every(i=>
              i.complete&&i.naturalWidth&&i.style.getPropertyValue('--barida-optical-transform'))''')
            rows = page.evaluate(MEASURE)
            for row in rows:
                target = .72 * {'bishop':1.02,'knight':.98,'rook':.98,'pawn':.93*.98}.get(row['type'],1)
                assert abs(row['height'] - target) < .001, (size, row)
                assert row['width'] < .76, (size, row)
                assert abs(row['cx']) < .001 and abs(row['cy']) < .001, (size, row)
            print(f'PASS {size}px: all 12 pieces match optical adjustments; centered, no overflow')
        # Check actual pages as well as the isolated renderer, including their CSS overrides.
        for filename in ['board.html','study.html','beginner.html','puzzles.html','training-lab.html','classroom.html','custom-homework-board.html']:
            page.goto(f'http://127.0.0.1:{server.server_port}/{filename}')
            page.locator('.board .sq img.barida-approved-piece').first.wait_for()
            page.wait_for_function("[...document.querySelectorAll('.board .sq img.barida-approved-piece')].every(i=>i.complete&&i.naturalWidth&&i.style.getPropertyValue('--barida-optical-transform'))")
            page.wait_for_function(r"""()=>[...document.querySelectorAll('.board .sq img.barida-approved-piece')].every(i=>{const scale=Number(i.style.getPropertyValue('--barida-optical-transform').match(/scale\(([^)]+)/)?.[1]);return Math.abs(new DOMMatrix(getComputedStyle(i).transform).a-scale)<.0001})""")
            # The precomputed bounds are verified against the actual alpha pixels above.
            rows=page.evaluate(MEASURE)
            assert rows,filename
            for item in rows:
                target=.72*{'bishop':1.02,'knight':.98,'rook':.98,'pawn':.93*.98}.get(item['type'],1)
                assert '.webp?' in item['name'],(filename,item)
                assert abs(item['height']-target)<.012,(filename,item)
                assert abs(item['cx'])<.02 and abs(item['cy'])<.02,(filename,item)
            print('PASS actual canonical pieces:',filename,len(rows))
        assert not errors, errors
        browser.close()
finally:
    server.shutdown()
