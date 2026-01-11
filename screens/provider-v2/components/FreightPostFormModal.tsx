// import React, { useState, useEffect } from 'react';
// import { Package, FreightPost } from '../../../models/types';
// import { XMarkIcon } from '../icons/ActionIcons';

// interface FreightPostFormModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onCreate: (post: Omit<FreightPost, 'id' | 'packageId'>) => void;
//   pkg: Package | null;
// }

// const FreightPostFormModal: React.FC<FreightPostFormModalProps> = ({ isOpen, onClose, onCreate, pkg }) => {
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     startLocation: '',
//     endLocation: '',
//     expectedPickupDate: '',
//     expectedDeliveryDate: '',
//     startTimeToPickup: '09:00',
//     endTimeToPickup: '17:00',
//     startTimeToDelivery: '09:00',
//     endTimeToDelivery: '17:00',
//   });

//   useEffect(() => {
//     if (pkg) {
//       setFormData(prev => ({
//         ...prev,
//         title: `Delivery of: ${pkg.title}`,
//         description: `Transport package containing: ${pkg.description}`,
//       }));
//     }
//   }, [pkg, isOpen]);

//   if (!isOpen || !pkg) return null;

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };
  
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onCreate(formData);
//   };

//   return (
//     <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4 animate-fade-in" onClick={onClose}>
//       <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl w-full max-w-3xl shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Post Package for Delivery</h2>
//           <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
//             <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
//           </button>
//         </div>
        
//         <div className="mb-6 p-4 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50 flex items-center gap-4">
//             <img src={pkg.images[0]?.packageImageURL} alt={pkg.title} className="w-16 h-16 rounded-md object-cover"/>
//             <div>
//                 <h3 className="font-bold text-lg text-gray-900 dark:text-white">{pkg.title}</h3>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.weightKg} kg, {pkg.volumeM3} m³</p>
//             </div>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
//             <div>
//                 <label htmlFor="title-post" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Title</label>
//                 <input type="text" name="title" id="title-post" value={formData.title} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700" />
//             </div>
//             <div>
//                 <label htmlFor="description-post" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Post Description</label>
//                 <textarea name="description" id="description-post" value={formData.description} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700"></textarea>
//             </div>
            
//             <fieldset className="p-4 border dark:border-gray-600 rounded-lg">
//                 <legend className="text-lg font-semibold px-2">Route Details</legend>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
//                     <div>
//                         <label htmlFor="startLocation" className="block text-sm font-medium">Pickup Location</label>
//                         <input type="text" name="startLocation" id="startLocation" value={formData.startLocation} onChange={handleChange} required className="mt-1 block w-full input-field" placeholder="e.g., 123 Main St, Anytown" />
//                     </div>
//                      <div>
//                         <label htmlFor="endLocation" className="block text-sm font-medium">Delivery Location</label>
//                         <input type="text" name="endLocation" id="endLocation" value={formData.endLocation} onChange={handleChange} required className="mt-1 block w-full input-field" placeholder="e.g., 456 Oak Ave, Otherville" />
//                     </div>
//                     <div>
//                         <label htmlFor="expectedPickupDate" className="block text-sm font-medium">Pickup Date</label>
//                         <input type="date" name="expectedPickupDate" id="expectedPickupDate" value={formData.expectedPickupDate} onChange={handleChange} required className="mt-1 block w-full input-field" />
//                     </div>
//                      <div>
//                         <label htmlFor="expectedDeliveryDate" className="block text-sm font-medium">Delivery Date</label>
//                         <input type="date" name="expectedDeliveryDate" id="expectedDeliveryDate" value={formData.expectedDeliveryDate} onChange={handleChange} required className="mt-1 block w-full input-field" />
//                     </div>
//                      <div>
//                         <label className="block text-sm font-medium">Pickup Time Window</label>
//                         <div className="flex items-center gap-2 mt-1">
//                             <input type="time" name="startTimeToPickup" value={formData.startTimeToPickup} onChange={handleChange} required className="block w-full input-field" />
//                             <span>-</span>
//                             <input type="time" name="endTimeToPickup" value={formData.endTimeToPickup} onChange={handleChange} required className="block w-full input-field" />
//                         </div>
//                     </div>
//                      <div>
//                         <label className="block text-sm font-medium">Delivery Time Window</label>
//                         <div className="flex items-center gap-2 mt-1">
//                             <input type="time" name="startTimeToDelivery" value={formData.startTimeToDelivery} onChange={handleChange} required className="block w-full input-field" />
//                              <span>-</span>
//                             <input type="time" name="endTimeToDelivery" value={formData.endTimeToDelivery} onChange={handleChange} required className="block w-full input-field" />
//                         </div>
//                     </div>
//                 </div>
//             </fieldset>

//             <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//                 <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold">Cancel</button>
//                 <button type="submit" className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors font-semibold shadow-md">Post Delivery Job</button>
//             </div>
//         </form>
//       </div>
//       <style>{`
//         .input-field {
//             @apply rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200;
//         }
//         @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
//         .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
//         @keyframes scale-up { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
//         .animate-scale-up { animation: scale-up 0.3s ease-out forwards; }
//       `}</style>
//     </div>
//   );
// };

// export default FreightPostFormModal;
