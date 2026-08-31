import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

old_code = """    const unsubSchedule = onSnapshot(collection(db, 'scheduleEntries'), (snapshot) => {
      setScheduleEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as ScheduleEntry)));
    });"""

new_code = """    const unsubSchedule = onSnapshot(collection(db, 'scheduleEntries'), (snapshot) => {
      setScheduleEntries(snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          hours: data.hours > 24 ? data.hours / 60 : data.hours
        } as unknown as ScheduleEntry;
      }));
    });"""

content = content.replace(old_code, new_code)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
