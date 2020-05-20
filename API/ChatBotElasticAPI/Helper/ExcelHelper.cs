using ChatBotElasticAPI.Model;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.IO;

namespace ChatBotElasticAPI
{
    public static class ExcelHelper
    {
        public static IEnumerable<QNA> WorkSheetToQNA(Stream stream)
        {
            List<QNA> qnas = new List<QNA>();

            try
            {
                using (ExcelPackage xlPackage = new ExcelPackage(stream))
                {
                    ExcelWorksheet ws = xlPackage.Workbook.Worksheets[0];
                    int colCount = ws.Dimension.End.Column;  //get Column Count
                    int rowCount = ws.Dimension.End.Row;

                    for (int row = 2; row <= rowCount; row++)
                    {
                        qnas.Add(new QNA
                        {
                            Answer = ws.Cells[row, 2]?.Value?.ToString()?.Trim(),
                            Question = ws.Cells[row, 1]?.Value?.ToString()?.Trim()
                        });
                    }
                }
            }
            catch (Exception ex)
            {

            }

            return qnas;
        }
    }
}
