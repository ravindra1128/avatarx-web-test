const PatientCardHeading = ({ title, className }) => {
  return (
    <div>
      <h2 className={`text-lg font-bold text-gray-900 mb-2 text-left ${className}`}>{title}</h2>
    </div>
  );
};

export default PatientCardHeading;