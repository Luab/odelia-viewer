import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from '@ohif/ui';

const LabelingOptions = ({
  id,
  index,
  label,
  label_value,
  label_options,
  onClick,
  onChange,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedOption, setSelectedOption] = useState(label_value);

  const onChangeValueHandler = event => {
    const new_value = event.target.value
    setSelectedOption(new_value)
    event.stopPropagation();
    onChange(label, new_value);
  };


  const onMouseEnter = () => setIsHovering(true);
  const onMouseLeave = () => setIsHovering(false);

  return (
    <div
      className={classnames(
        'group relative flex cursor-pointer items-stretch bg-black border outline-none border-transparent transition duration-300',
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex="0"
      data-cy={'measurement-item'}
    >
      <div className="relative flex flex-col w-full p-1">
        <div className="flex items-center mb-1 ml-2">
          <div className="flex items-center flex-1 text-base text-primary-light">
            {label}
          </div>
        </div>
        <div className="flex items-center ml-3">
          <div className="flex items-center flex-1 text-base text-primary-light">
            <select onChange={e => onChangeValueHandler(e)}
              value={selectedOption}
            >
              {!!label_options.length &&
                label_options.map((option) => {
                  return <option key={option} value={option}>{option}</option>
                })}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

LabelingOptions.propTypes = {
  id: PropTypes.oneOfType([
    PropTypes.number.isRequired,
    PropTypes.string.isRequired,
  ]),
  index: PropTypes.number.isRequired,
  label: PropTypes.string,
  label_value: PropTypes.string,
  isActive: PropTypes.bool,
  isVisible: PropTypes.bool,
  onClick: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  toggleVisibility: PropTypes.func,
};

LabelingOptions.defaultProps = {
  isActive: false,
  label_value: "",
};

export default LabelingOptions;
