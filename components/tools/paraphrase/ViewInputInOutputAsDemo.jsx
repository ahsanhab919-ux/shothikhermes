const ViewInputInOutAsDemo = ({ input }) => {
  const plainText = input.replace(/<[^>]+>/g, "");

  return (
    <div className="absolute top-0 left-0 h-[92%] w-full overflow-hidden px-2 opacity-50">
      <p>{plainText}</p>
    </div>
  );
};

export default ViewInputInOutAsDemo;
