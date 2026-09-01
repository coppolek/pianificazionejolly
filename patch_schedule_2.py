import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# We can search for the two divs and swap them.
# Div 1:
div1_start = '          <div>\n            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">\n              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>\n              Assenze e Annotazioni della Settimana\n            </h3>'
div2_start = '          <div>\n            <div className="flex justify-between items-center mb-3">\n              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">\n                <span className="w-2 h-6 bg-rose-400 rounded-sm inline-block"></span>\n                Turni da Coprire\n              </h3>'

# Let's find exactly the blocks.
parts = content.split(div1_start)
if len(parts) == 2:
    before = parts[0]
    rest = parts[1]
    
    parts2 = rest.split(div2_start)
    if len(parts2) == 2:
        div1_content_raw = parts2[0]
        # div1_content_raw ends with '          </div>\n'
        # Let's cleanly separate.
        div1_full = div1_start + div1_content_raw
        # find the end of div2. it ends right before `        </div>\n      )}\n    </div>`
        
        # We can just look for the end of div2
        end_idx = parts2[1].find('        </div>\n      )}\n    </div>')
        div2_full = div2_start + parts2[1][:end_idx]
        
        # Write back
        new_content = before + div2_full + div1_full + parts2[1][end_idx:]
        with open('src/pages/SchedulePage.tsx', 'w') as f:
            f.write(new_content)
            
