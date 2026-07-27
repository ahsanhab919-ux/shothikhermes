"use client";

import { useEffect, useState } from "react";

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      setIsLoading(true);

      try {
        let country = null;

        // 1. Try Google API if key is available
        const googleKey = process.env.NEXT_PUBLIC_GOOGLE_GEOLOCATION_KEY;
        if (googleKey) {
          try {
            const geolocationResponse = await fetch(
              `https://www.googleapis.com/geolocation/v1/geolocate?key=${googleKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ considerIp: true }),
              }
            );

            if (geolocationResponse.ok) {
              const geolocationData = await geolocationResponse.json();
              if (geolocationData.location) {
                const { lat, lng } = geolocationData.location;
                const geocodingResponse = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`
                );
                if (geocodingResponse.ok) {
                  const geocodingData = await geocodingResponse.json();
                  if (geocodingData.results?.[0]) {
                    const countryComp = geocodingData.results[0].address_components.find(c => c.types.includes("country"));
                    if (countryComp) country = countryComp.long_name;
                  }
                }
              }
            }
          } catch (googleErr) {
            console.warn("Google Geolocation failed, trying fallback...", googleErr);
          }
        }

        // 2. Fallback to free IP geolocation if Google failed or no key
        if (!country) {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            country = data.country_name;
          }
        }

        if (country) {
          setLocation(country.toLowerCase());
        } else {
          throw new Error("Could not determine location");
        }

      } catch (err) {
        console.error("Geolocation error:", err);
        setError(err.message);
        // Default to something safe if everything fails, or keep null
        // setLocation("bangladesh"); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocation();
  }, []);

  return { location };
};

export default useGeolocation;
