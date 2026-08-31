import re

with open('src/pages/MasterDataPage.tsx', 'r') as f:
    content = f.read()

old_op_section_start = """function OperatoriSection() {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'jolly' | 'ordinario'>('jolly');"""

new_op_section_start = """function OperatoriSection() {
  const { employees, addEmployee, deleteEmployee, updateEmployee } = useAppContext();
  const [editingAssignmentsEmpId, setEditingAssignmentsEmpId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [type, setType] = useState<'jolly' | 'ordinario'>('jolly');"""

content = content.replace(old_op_section_start, new_op_section_start)

old_row_render = """                <OperatorRow 
                  key={emp.id} 
                  emp={emp} 
                  onDelete={() => deleteEmployee(emp.id)}
                  onUpdate={(updates) => updateEmployee(emp.id, updates)}
                />"""

new_row_render = """                <OperatorRow 
                  key={emp.id} 
                  emp={emp} 
                  onDelete={() => deleteEmployee(emp.id)}
                  onUpdate={(updates) => updateEmployee(emp.id, updates)}
                  onEditAssignments={() => setEditingAssignmentsEmpId(emp.id)}
                />"""

content = content.replace(old_row_render, new_row_render)

old_return_end = """      </div>
    </div>
  );
}"""

new_return_end = """      </div>
      {editingAssignmentsEmpId && (
        <OperatorAssignmentsModal 
          isOpen={true} 
          onClose={() => setEditingAssignmentsEmpId(null)} 
          emp={employees.find(e => e.id === editingAssignmentsEmpId)!} 
        />
      )}
    </div>
  );
}"""

content = content.replace(old_return_end, new_return_end)

with open('src/pages/MasterDataPage.tsx', 'w') as f:
    f.write(content)

