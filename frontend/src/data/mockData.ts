export interface Staff {
  id: string;
  name: string;
  role: string;
  departmentId: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  name: string;
  regNo: string;
  departmentId: string;
}

export interface ActivityLog {
  id: string;
  submittedBy: string;
  activity: string;
  date: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  departmentId: string;
}

export const departments = [
  { id: '1', name: 'Cardiology', hod: 'Dr. John Watson' },
  { id: '2', name: 'Neurology', hod: 'Dr. Stephen Strange' },
  { id: '3', name: 'Pediatrics', hod: 'Dr. Meredith Grey' },
];

export const allStaff: Staff[] = [
  { id: 's1', name: 'Dr. Evelyn Reed', role: 'Senior Cardiologist', departmentId: '1', studentIds: ['u1', 'u2'] },
  { id: 's2', name: 'Dr. Ben Carter', role: 'Neurologist', departmentId: '2', studentIds: ['u3'] },
  { id: 's3', name: 'Dr. Olivia Chen', role: 'Pediatrician', departmentId: '3', studentIds: [] },
  { id: 's4', name: 'Nurse Alex Dawson', role: 'Head Nurse', departmentId: '1', studentIds: [] },
  { id: 's5', name: 'Dr. Sam Wilson', role: 'Surgeon', departmentId: '2', studentIds: [] },
];

export const allStudents: Student[] = [
  { id: 'u1', name: 'Liam Smith', regNo: 'MED101', departmentId: '1' },
  { id: 'u2', name: 'Ava Johnson', regNo: 'MED102', departmentId: '1' },
  { id: 'u3', name: 'Noah Williams', regNo: 'MED103', departmentId: '1' },
  { id: 'u4', name: 'Emma Brown', regNo: 'NEURO201', departmentId: '2' },
  { id: 'u5', name: 'Oliver Jones', regNo: 'PEDS301', departmentId: '3' },
];

export const allActivityLogs: ActivityLog[] = [
  { id: 'l1', submittedBy: 'Dr. Evelyn Reed', activity: 'Published clinical trial results', date: '2023-10-26', status: 'Approved', departmentId: '1' },
  { id: 'l2', submittedBy: 'Liam Smith', activity: 'Assisted in a cardiac surgery', date: '2023-10-25', status: 'Pending', departmentId: '1' },
  { id: 'l3', submittedBy: 'Dr. Ben Carter', activity: 'Completed neurology ward rounds', date: '2023-10-24', status: 'Approved', departmentId: '2' },
  { id: 'l4', submittedBy: 'Emma Brown', activity: 'Presented a case study on pediatric care', date: '2023-10-23', status: 'Rejected', departmentId: '2' },
];
