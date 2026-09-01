import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

assenze_div = '                  <div key={leave.id} className="bg-white p-3 rounded-lg shadow-sm border border-amber-100 flex flex-col min-h-[100px]">'
new_assenze_div = """                  <div 
                    key={leave.id} 
                    className="bg-white p-3 rounded-lg shadow-sm border border-amber-100 flex flex-col min-h-[100px] cursor-move hover:shadow-md transition-shadow active:cursor-grabbing"
                    draggable
                    onDragStart={(ev) => {
                      const data = {
                        type: 'NEW_SHIFT',
                        workSiteName: leave.notes ? `${leave.type}: ${leave.notes}` : leave.type,
                        startTime: '',
                        endTime: ''
                      };
                      ev.dataTransfer.setData('application/json', JSON.stringify(data));
                    }}
                  >"""

if assenze_div in content:
    content = content.replace(assenze_div, new_assenze_div)
    with open('src/pages/SchedulePage.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")

