import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Replace the start of the min-w-full block
old_block_start = '      <div className="space-y-8 min-w-full md:min-w-[1200px]">'
new_block_start = '      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">\n        <div className="space-y-8 min-w-full md:min-w-[1200px]">'
content = content.replace(old_block_start, new_block_start)

# The end of that block is before the "weeklyLeaves.length > 0" section
# Let's find it.
old_block_end = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>

      </div>
      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && ("""

new_block_end = """        {employees.filter(emp => !emp.type || emp.type === 'jolly').length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
            Nessun operatore Jolly in anagrafica.
          </div>
        )}
      </div>
      </div>
      </div>
      {(weeklyLeaves.length > 0 || shiftsToCover.length > 0) && ("""

content = content.replace(old_block_end, new_block_end)

# Let's also add min-w-0 flex-1 to the text truncate elements to be safe
content = content.replace('className="font-bold text-sm text-gray-900 truncate"', 'className="font-bold text-sm text-gray-900 truncate min-w-0 flex-1"')
content = content.replace('className="text-xs text-gray-500 mb-2"', 'className="text-xs text-gray-500 mb-2 truncate min-w-0"')
content = content.replace('className="text-xs font-semibold text-gray-700 mb-2"', 'className="text-xs font-semibold text-gray-700 mb-2 truncate min-w-0"')

# And make notes break words
content = content.replace('className="text-xs text-gray-700 bg-amber-50 p-2 rounded mt-auto border border-amber-100/50"', 'className="text-xs text-gray-700 bg-amber-50 p-2 rounded mt-auto border border-amber-100/50 break-words whitespace-normal"')
content = content.replace('className="text-xs text-rose-700 bg-rose-50/50 px-2 py-1.5 rounded mt-auto border border-rose-100/50 font-medium"', 'className="text-xs text-rose-700 bg-rose-50/50 px-2 py-1.5 rounded mt-auto border border-rose-100/50 font-medium break-words whitespace-normal"')


with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)
