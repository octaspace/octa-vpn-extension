import { useEffect, useState } from "react";
import { initSecureStorage, tokenExists } from "~helpers/storage";
import { Loader } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

function Main() {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      await initSecureStorage();
      if(await tokenExists()){
        navigate('/home') 
      }
      else{
        navigate('/login')
      }
    };

    fetchData();
  }, []);

  return (
    <Loader />
  );
}

export default Main;
