import React, { useState } from 'react';
import Cascader from 'rc-cascader';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClearIcon from '@material-ui/icons/Clear';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import { withStyles } from '@material-ui/core/styles';
import { TextField, IconButton, InputAdornment } from '@material-ui/core';
import { useTranslations, useGraphqlQuery } from '@openimis/fe-core';

const styles = () => ({
  root: {
    width: '100%',
  },
  '@keyframes spin': {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },
  spin: {
    animation: '$spin 1s linear infinite',
  },
});

function CategoryPicker(props) {
  const {
    onChange,
    readOnly,
    required,
    value,
    label,
    placeholder,
    classes,
  } = props;
  const { formatMessage } = useTranslations('ticket');
  const [inputValue, setInputValue] = useState(value ?? '');

  React.useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const { isLoading, data, error } = useGraphqlQuery(
    `query CategoryPicker {
        grievanceConfig{
          grievanceCategoriesJson
        }
    }`,
    {},
    { skip: false },
  );

  const translateName = (name) => {
    const key = `CategoryPicker.category.${name}`;
    const translated = formatMessage(key);
    return translated !== key ? translated : name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const buildOptions = (categories) => (categories ?? []).map((cat) => ({
    label: translateName(cat.name),
    value: cat.full_name,
    children: cat.children?.length ? buildOptions(cat.children) : undefined,
  }));

  const rawJson = data?.grievanceConfig?.grievanceCategoriesJson;
  const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
  const options = buildOptions(parsed);

  const handleClear = (e) => {
    e.stopPropagation();
    setInputValue('');
    onChange?.(null, null);
  };

  const handleCascaderChange = (values, selectedOptions = []) => {
    const selected = selectedOptions.length ? selectedOptions[selectedOptions.length - 1] : null;
    const stringValue = selected?.value ?? null;
    setInputValue(stringValue || '');
    onChange?.(stringValue, selected);
  };

  const defaultValue = () => {
    if (!value) {
      return [];
    }
    const parts = value.split(' > ');
    return parts.map((_, index) => parts.slice(0, index + 1).join(' > '));
  };

  return (
    <div className={classes.root}>
      <Cascader
        value={defaultValue()}
        options={options}
        onChange={handleCascaderChange}
        changeOnSelect
        getPopupContainer={(trigger) => trigger.parentElement}
        disabled={readOnly || isLoading}
        expandIcon={<KeyboardArrowRightIcon fontSize="small" />}
        loadingIcon={<AutorenewIcon fontSize="small" className={classes.spin} />}
      >
        <TextField
          label={label || formatMessage('CategoryPicker.label')}
          placeholder={placeholder ?? formatMessage('CategoryPicker.placeholder')}
          required={required}
          value={inputValue}
          fullWidth
          disabled={readOnly || isLoading}
          error={!!error}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                {inputValue && !readOnly && (
                  <IconButton size="small" onClick={handleClear}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <ArrowDropDownIcon style={{ color: 'rgba(0, 0, 0, 0.54)' }} />
              </InputAdornment>
            ),
          }}
        />
      </Cascader>
    </div>
  );
}

export default withStyles(styles)(CategoryPicker);
