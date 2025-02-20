import React, { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import { useService } from "../ContextAPI/axios";
import io from "socket.io-client";

const socket = io(`${import.meta.env.VITE_SERVER}`);

function ScoreTable() {
  const { getMatchData, matchData } = useService();
  const gameId = useParams();

  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    getMatchData(gameId.id);
  }, [gameId.id]);

  useEffect(() => {
    if (matchData?.scores) {
      const firstTeamName = toSentenceCase(matchData.firstTeamName);
      const secondTeamName = toSentenceCase(matchData.secondTeamName);
      const combined = matchData?.scores.map((newData) => ({
        ...newData,
        firstTeamName,
        secondTeamName,
      }));
      setTableData(combined.reverse());
    }
  }, [matchData]);

  useEffect(() => {
    socket.on("score_updated", (data) => {
      if (data.status === "start") {
        setTableData((prev) => [data, ...prev]);
      }
    });

    return () => {
      socket.off("score_updated");
    };
  }, []);

  function toSentenceCase(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  const columns = [
    {
      field: "firstTeamName",
      headerName: "First Team",
      flex: 1,
      disableColumnMenu: true,
      sortable: false,
      resizable: false,
    },
    {
      field: "secondTeamName",
      headerName: "Second Team",
      flex: 1,
      disableColumnMenu: true,
      sortable: false,
      resizable: false,
    },
    {
      field: "firstTeamScore",
      headerName: "First Team Score",
      flex: 1,
      disableColumnMenu: true,
      sortable: false,
      resizable: false,
    },
    {
      field: "secondTeamScore",
      headerName: "Second Team Score",
      flex: 1,
      disableColumnMenu: true,
      sortable: false,
      resizable: false,
    },
    {
      field: "numberOfShuttlecock",
      headerName: "Shuttle Cock",
      flex: 1,
      disableColumnMenu: true,
      sortable: false,
      resizable: false,
    },
  ];

  return (
    <>
      <div className="font-inter z-50">
        <DataGrid
          rows={tableData}
          getRowId={(row) => row._id}
          columns={columns}
          hideFooter
          disableSelectionOnClick
          sx={{
            border: "none",
            width: "100%",
            "& .MuiDataGrid-cell": {
              minHeight: 60,
              textAlign: "center",
              backgroundColor: "white",
              fontSize: "clamp(12px,  2.5vw, 18px)",
              lineHeight: "50px",
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "#5ea0b8",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#d0d0d0",
              height: "auto",
              width: "100%",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              whiteSpace: "normal",
              fontSize: "20px",
              fontWeight: "700",
              textAlign: "center",
              wordWrap: "break-word",
              lineHeight: "normal",
              fontFamily: "Inter",
              "@media (max-width: 1024px)": {
                fontSize: "16px",
                fontWeight: "700",
              },
              "@media (max-width: 900px)": {
                fontSize: "14px",
                fontWeight: "700",
              },
              "@media (max-width: 600px)": {
                fontSize: "12px",
                fontWeight: "500",
              },
            },
            "& .MuiDataGrid-columnHeaderTitleContainer": {
              justifyContent: "center",
            },
            "&  .MuiDataGrid-container--top": {
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "#5ea0b8",
            },
            "& .MuiDataGrid-iconSeparator": {
              color: "#5ea0b8",
              height: "56px",
              width: "56px",
            },
          }}
        />
      </div>
    </>
  );
}

export default ScoreTable;
