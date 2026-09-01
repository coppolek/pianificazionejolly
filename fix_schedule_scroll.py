import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# 1. Wrap the space-y-8 min-w-[1200px] in an overflow container
old_block_start = '      <div className="space-y-8 min-w-full md:min-w-[1200px]">'
new_block_start = '      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">\n        <div className="space-y-8 min-w-full md:min-w-[1200px]">'

content = content.replace(old_block_start, new_block_start)

# We need to add a closing div after the employees map.
old_block_end = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>

      </div>"""

new_block_end = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>
      </div>

      </div>"""

# Wait, let's just find the exact closing div.
