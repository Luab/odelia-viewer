import { DicomMetadataStore } from '@ohif/core';

export default function downloadCSVReport(measurementData) {
  if (measurementData.length === 0) {
    // Prevent download of report with no measurements.
    return;
  }

  const columns = [
    'Patient ID',
    'Patient Name',
    'StudyInstanceUID'
  ];

  const reportMap = {};
  const labelMeasurements = measurementData.filter(measurement => measurement.type == "ODELIALabel")
  const leisonMeasurements = measurementData.filter(measurement => measurement.type == "value_type::circle")
  labelMeasurements.forEach(measurement => {
    const {
      referenceStudyUID,
      referenceSeriesUID,
      getReport,
      uid,
      type
    } = measurement;

    //if (type != "ODELIALabel") {
    //  console.warn('Skipping leisons for now');
    //  return;
    //}
    if (!getReport) {
      console.warn('Measurement does not have a getReport function');
      return;
    }
    console.log(referenceStudyUID)
    console.log(measurement)
    const studyMetadata = DicomMetadataStore.getStudy(
      referenceStudyUID
    );
    const seriesMetadata = DicomMetadataStore.getSeries(
      referenceStudyUID,
      studyMetadata.series[0].SeriesInstanceUID,
    );

    const commonRowItems = _getCommonRowItems(measurement, seriesMetadata);
    const report = getReport(measurement);


    //Filter leisions same as current study AND that has been annotated
    const filteredLeisions = leisonMeasurements.filter(measurement => measurement.referenceStudyUID == referenceStudyUID)
      .filter(measurement => measurement.label_data !== undefined)

    // Duplicate ODELIA label for each leision and add leision report, otherwise return ODELIALAbel
    if (filteredLeisions.length != 0) {
      filteredLeisions.forEach(leisonMeasurement => {
        const {
          getReport,
          uid,
          metadata
        } = leisonMeasurement;

        const leisionReport = getReport(leisonMeasurement);
        report.columns = [...report.columns, ...leisionReport.columns]
        report.values = [...report.values, ...leisionReport.values]
        report.columns.push("referencedImageId")
        report.values.push(metadata['referencedImageId'])
        reportMap[uid] = {
          report,
          commonRowItems,
        };
      }
      )
    }
    else {
      reportMap[uid] = {
        report,
        commonRowItems,
      };
    }
  });

  // get columns names inside the report from each measurement and
  // add them to the rows array (this way we can add columns for any custom
  // measurements that may be added in the future)
  Object.keys(reportMap).forEach(id => {
    const { report } = reportMap[id];
    report.columns.forEach(column => {
      if (!columns.includes(column)) {
        columns.push(column);
      }
    });
  });

  const results = _mapReportsToRowArray(reportMap, columns);

  let csvContent =
    'data:text/csv;charset=utf-8,' +
    results.map(res => res.join(',')).join('\n');

  _createAndDownloadFile(csvContent);
}

function _mapReportsToRowArray(reportMap, columns) {
  const results = [columns];
  Object.keys(reportMap).forEach(id => {
    const { report, commonRowItems } = reportMap[id];
    const row = [];
    // For commonRowItems, find the correct index and add the value to the
    // correct row in the results array
    Object.keys(commonRowItems).forEach(key => {
      const index = columns.indexOf(key);
      const value = commonRowItems[key];
      row[index] = value;
    });

    // For each annotation data, find the correct index and add the value to the
    // correct row in the results array
    report.columns.forEach((column, index) => {
      const colIndex = columns.indexOf(column);
      const value = report.values[index];
      row[colIndex] = value;
    });

    results.push(row);
  });

  return results;
}

function _getCommonRowItems(measurement, seriesMetadata) {
  const firstInstance = seriesMetadata.instances[0];

  return {
    'Patient ID': firstInstance.PatientID, // Patient ID
    'Patient Name': firstInstance.PatientName.Alphabetic, // PatientName
    StudyInstanceUID: measurement.referenceStudyUID, // StudyInstanceUID
    Label: measurement.label || '', // Label
  };
}

function _createAndDownloadFile(csvContent) {
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'MeasurementReport.csv');
  document.body.appendChild(link);
  link.click();
}
