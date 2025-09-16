import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Button from '../../components/ui/button/Button';
import Select from '../../components/form/Select';

// Zod schema for the new detailed form
const activitySchema = z.object({
  activityDate: z.string().min(1, 'Activity date is required'),
  activityType: z.string().min(1, 'Activity type is required'),
  title: z.string().min(3, 'Title is required'),
  detailedDescription: z.string().min(10, 'A detailed description is required'),
  department: z.string().min(1, 'Department/Subject is required'),
  levelOfInvolvement: z.string().min(1, 'Level of involvement is required'),
  patientId: z.string().min(1, 'Patient/Case ID is required'),
  ageGender: z.string().min(1, 'Age/Gender is required'),
  diagnosis: z.string().min(1, 'Diagnosis/Topic is required'),
  attachments: z.any().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

// Mock data for dropdowns
const activityTypeOptions = [
  { value: 'clinical_rotation', label: 'Clinical Rotation' },
  { value: 'surgical_procedure', label: 'Surgical Procedure' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'grand_rounds', label: 'Grand Rounds' },
  { value: 'research', label: 'Research' },
  { value: 'patient_care', label: 'Patient Care' },
  { value: 'other', label: 'Other' },
];

const departmentOptions = [
  { value: 'general_medicine', label: 'General Medicine' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'obgyn', label: 'Obstetrics & Gynecology' },
  { value: 'other', label: 'Other' },
];

const involvementOptions = [
  { value: 'performed', label: 'Performed' },
  { value: 'assisted', label: 'Assisted' },
  { value: 'observed', label: 'Observed' },
  { value: 'presented', label: 'Presented' },
  { value: 'independent', label: 'Independent' },
  { value: 'in_progress', label: 'In-progress' },
];

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-4 pt-6">
    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-700 pb-2">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
);

const FormField: React.FC<{ label: string; error?: string; children: React.ReactNode; className?: string }> = ({ label, error, children, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

const SubmitActivity: React.FC = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      activityDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    const formData = new FormData();

    // Handle file attachments
    if (data.attachments && data.attachments.length > 0) {
      for (let i = 0; i < data.attachments.length; i++) {
        formData.append('attachments', data.attachments[i]);
      }
    }

    // Append other form data fields
    Object.keys(data).forEach(key => {
      if (key !== 'attachments') {
        formData.append(key, (data as any)[key]);
      }
    });

    try {
      // Mocking API call for demonstration
      console.log('Submitting form data:', ...formData.entries());
      toast.loading('Submitting activity...');

      // Replace with your actual API endpoint fetch call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // const response = await fetch('/api/activities', {
      //   method: 'POST',
      //   body: formData,
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Failed to submit activity.');
      // }

      toast.dismiss();
      toast.success('Activity submitted successfully!');
      reset();

    } catch (error) {
      toast.dismiss();
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unknown error occurred. Please try again.');
      }
      console.error('Submission failed:', error);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Submit New Activity</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200 dark:divide-gray-700">
          
          {/* Basic Details Section */}
          <FormSection title="Basic Details">
            <FormField label="Date of Activity" error={errors.activityDate?.message}>
              <Controller
                control={control}
                name="activityDate"
                render={({ field }) => (
                  <DatePicker
                    selected={field.value ? new Date(field.value) : null}
                    onChange={(date: Date | null) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                    dateFormat="yyyy-MM-dd"
                    className="input-field"
                    placeholderText="Select date"
                  />
                )}
              />
            </FormField>
            <FormField label="Activity Type" error={errors.activityType?.message}>
              <Controller name="activityType" control={control} render={({ field }) => <Select options={activityTypeOptions} placeholder="Select type..." {...field} />} />
            </FormField>
            <FormField label="Title / Short Description" error={errors.title?.message} className="md:col-span-2">
              <input type="text" placeholder="Enter a brief title for the activity" {...register('title')} className="input-field" />
            </FormField>
          </FormSection>

          {/* Activity Details Section */}
          <FormSection title="Activity Details">
            <FormField label="Detailed Description / Reflection" error={errors.detailedDescription?.message} className="md:col-span-2">
              <textarea rows={5} placeholder="Provide a detailed description of the activity and your reflection..." {...register('detailedDescription')} className="input-field"></textarea>
            </FormField>
            <FormField label="Department" error={errors.department?.message}>
              <Controller name="department" control={control} render={({ field }) => <Select options={departmentOptions} placeholder="Select department..." {...field} />} />
            </FormField>
            <FormField label="Level of Involvement" error={errors.levelOfInvolvement?.message}>
              <Controller name="levelOfInvolvement" control={control} render={({ field }) => <Select options={involvementOptions} placeholder="Select involvement..." {...field} />} />
            </FormField>
            <FormField label="Patient / Case ID" error={errors.patientId?.message}>
              <input type="text" placeholder="e.g., P12345" {...register('patientId')} className="input-field" />
            </FormField>
            <FormField label="Age / Gender" error={errors.ageGender?.message}>
              <input type="text" placeholder="e.g., 45 / Male" {...register('ageGender')} className="input-field" />
            </FormField>
            <FormField label="Diagnosis / Topic" error={errors.diagnosis?.message} className="md:col-span-2">
              <input type="text" placeholder="Enter diagnosis or topic..." {...register('diagnosis')} className="input-field" />
            </FormField>
          </FormSection>

          {/* Attachments Section */}
          <FormSection title="Attachments">
            <FormField label="Upload Files (PDF, JPG, DOC, etc.)" className="md:col-span-2">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-gray-600">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400"><label htmlFor="attachments" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-brand-600 hover:text-brand-500"><span>Upload a file</span><input id="attachments" type="file" className="sr-only" {...register('attachments')} /></label><p className="pl-1">or drag and drop</p></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Any format up to 10MB</p>
                </div>
              </div>
            </FormField>
          </FormSection>

          {/* System/Review Fields Section */}
          <FormSection title="System / Review Fields (Read-only)">
            <FormField label="Faculty Remark" className="md:col-span-2">
              <textarea rows={3} readOnly value="Pending review from faculty..." className="input-field-readonly"></textarea>
            </FormField>
            <FormField label="Status">
              <p className="block w-full px-4 py-2 rounded-md bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</p>
            </FormField>
          </FormSection>

          <div className="pt-5">
            <div className="flex justify-end">
              <Button type="button" variant='outline' onClick={() => reset()} className="mr-3">Cancel</Button>
              <Button type="submit">Submit Activity</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitActivity;
