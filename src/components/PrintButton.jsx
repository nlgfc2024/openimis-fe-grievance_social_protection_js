import { useReactToPrint } from 'react-to-print';
import { IconButton } from '@mui/material';

const PrintButton = ({ contentRef, children, ...props }) => {
  const handlePrint = useReactToPrint({ contentRef });

  return (
    <IconButton
      variant="contained"
      component="label"
      onClick={handlePrint}
      {...props}
    >
      {children}
    </IconButton>
  );
};

export default PrintButton;
