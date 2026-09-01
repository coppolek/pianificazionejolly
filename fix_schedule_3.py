import re

with open('src/pages/SchedulePage.tsx', 'r') as f:
    content = f.read()

# Let's find the Assenze block that was misplaced at the very end
assenze_block = content[content.find('          <div>\\n            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">\\n              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>\\n              Assenze e Annotazioni della Settimana\\n            </h3>'):]

assenze_search = '          <div>\n            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">\n              <span className="w-2 h-6 bg-amber-400 rounded-sm inline-block"></span>\n              Assenze e Annotazioni della Settimana\n            </h3>'

idx = content.find(assenze_search)
if idx != -1:
    assenze_block = content[idx:]
    content = content[:idx] # remove it from end

# Now we need to insert it back before '        </div>\n      )}\n    </div>\n  );\n}\n'
# Let's find:
#         </div>
#       )}
#     </div>
#   );
# }

target_insert = '        </div>\n      )}\n    </div>\n  );\n}\n'
target_idx = content.find(target_insert)

if target_idx != -1:
    content = content[:target_idx] + assenze_block + '\n' + target_insert
else:
    # let's try a softer match
    target_insert_2 = '        </div>\n      )}\n    </div>\n  );\n}'
    target_idx = content.find(target_insert_2)
    if target_idx != -1:
        content = content[:target_idx] + assenze_block + '\n' + target_insert_2

with open('src/pages/SchedulePage.tsx', 'w') as f:
    f.write(content)

