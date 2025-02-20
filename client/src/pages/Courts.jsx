import React from "react";

function Courts() {
  const courts = [
    { id: 1, name: "silver", price: 50 },
    { id: 2, name: "gold", price: 80 },
    { id: 3, name: "premium", price: 150 },
  ];
  return (
    <>
      <h1 className="text-3xl text-white font-bold mt-20 mb-5 font-inter">
        Courts
      </h1>
      <hr />
      <div className="mt-8 w-[90%] h-[65vh] sm:h-auto overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {courts.map((court) => (
            <div
              key={court.id}
              className="max-w-sm rounded-3xl overflow-hidden shadow-lg bg-[#7CB6CB] p-2 md:p-4 font-inter"
            >
              <img
                className="w-36 xs:w-48 md:w-full rounded-xl"
                src={`../${court.name}.jpg`}
                alt={`${court.name} court`}
              />
              <div className="px-2 sm:px-6 py-1 sm:py-4 text-white">
                <div className="font-bold text-xl mb-2">
                  {court.name.toUpperCase()}
                </div>
                <p className="text-gray-700 text-base">
                  ${court.price} per/match
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Courts;
