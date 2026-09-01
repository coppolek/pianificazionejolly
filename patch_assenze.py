import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

assenze_code = """          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>
              Assenze e Annotazioni della Settimana
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
              {weeklyLeaves.length === 0 && <span className="text-sm text-amber-600">Nessuna assenza per questa settimana</span>}
              {weeklyLeaves.map(leave => {
                const emp = employees.find(e => e.id === leave.employeeId);
                const isSingleDay = leave.startDate === leave.endDate;
                const dateStr = isSingleDay 
                  ? formatHeaderDate(leave.startDate) 
                  : `${formatHeaderDate(leave.startDate)} - ${formatHeaderDate(leave.endDate)}`;
                
                return (
                  <div key={leave.id} className="bg-white p-3 rounded-lg shadow-sm border border-amber-100 flex flex-col min-h-[100px]">
                    <div className="flex justify-between items-start mb-1 gap-2">
                      <span className="font-bold text-sm text-gray-900 truncate min-w-0 flex-1" title={emp?.name || 'Annotazione Generica'}>
                        {emp?.name || (leave.employeeId ? 'Operatore eliminato' : 'Annotazione Generica')}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                        {leave.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2 truncate min-w-0">{dateStr}</div>
                    {leave.notes && (
                      <div className="text-xs text-gray-700 bg-amber-50 p-2 rounded mt-auto border border-amber-100/50 break-words whitespace-normal">
                        {leave.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>"""

# I need to insert it right before:
#           </div>
#         </div>
#       )}

target = "            </div>\n          </div>\n        </div>\n      )}\n"
new_target = "            </div>\n          </div>\n" + assenze_code + "\n        </div>\n      )}\n"

content = content.replace(target, new_target)

# I should also fix the grid, because now they will be side by side if it is xl:grid-cols-2.
# Let's change `grid-cols-1 xl:grid-cols-2` to `grid-cols-1 gap-y-12` so they stack.

content = content.replace('className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-8 w-full"', 'className="mt-8 flex flex-col gap-8 w-full"')

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
