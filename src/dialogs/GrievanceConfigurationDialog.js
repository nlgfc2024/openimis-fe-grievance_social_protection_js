import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGrievanceConfiguration } from '../actions';

function GrievanceConfigurationDialog() {
  const dispatch = useDispatch();
  const fetchedGrievanceConfig = useSelector((state) => state?.grievanceSocialProtection?.fetchedGrievanceConfig);

  useEffect(() => {
    if (!fetchedGrievanceConfig) {
      dispatch(fetchGrievanceConfiguration());
    }
  }, [fetchedGrievanceConfig]);

  return null;
}

export default GrievanceConfigurationDialog;
